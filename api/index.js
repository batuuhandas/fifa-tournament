const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let db = null;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      db.serialize(() => {
        // Admin tablosu
        db.run(`CREATE TABLE admin (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        )`);

        // Ligler tablosu
        db.run(`CREATE TABLE leagues (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Takımlar tablosu
        db.run(`CREATE TABLE teams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          league_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          logo_color1 TEXT DEFAULT '#FF0000',
          logo_color2 TEXT DEFAULT '#0000FF',
          points INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          draws INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          goals_for INTEGER DEFAULT 0,
          goals_against INTEGER DEFAULT 0,
          FOREIGN KEY (league_id) REFERENCES leagues (id) ON DELETE CASCADE
        )`);

        // Maçlar tablosu
        db.run(`CREATE TABLE matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          league_id INTEGER NOT NULL,
          home_team_id INTEGER NOT NULL,
          away_team_id INTEGER NOT NULL,
          home_score INTEGER,
          away_score INTEGER,
          match_date TEXT,
          venue TEXT,
          weather TEXT,
          is_completed BOOLEAN DEFAULT FALSE,
          round_number INTEGER DEFAULT 1,
          FOREIGN KEY (league_id) REFERENCES leagues (id) ON DELETE CASCADE,
          FOREIGN KEY (home_team_id) REFERENCES teams (id) ON DELETE CASCADE,
          FOREIGN KEY (away_team_id) REFERENCES teams (id) ON DELETE CASCADE
        )`);

        // Varsayılan admin kullanıcısı ekle
        const hashedPassword = bcrypt.hashSync('das', 10);
        
        db.run(`INSERT INTO admin (username, password) VALUES (?, ?)`, 
               ['batuhan', hashedPassword], (err) => {
          if (err) {
            console.error('Admin kullanıcısı oluşturulamadı:', err);
            reject(err);
          } else {
            console.log('Admin kullanıcısı oluşturuldu: batuhan/das');
            resolve(db);
          }
        });
      });
    });
  });
}

// Main serverless handler - Vercel'de tek endpoint olarak çalışır
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Database'i başlat
    if (!db) {
      await initDatabase();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fifa-secret-key-2025';
    const url = req.url || '';

    // Auth endpoints
    if (url.includes('/auth/login') && req.method === 'POST') {
      const { username, password } = req.body;

      return new Promise((resolve) => {
        db.get('SELECT * FROM admin WHERE username = ?', [username], async (err, user) => {
          if (err || !user) {
            res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
            return resolve();
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
            return resolve();
          }

          const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          res.json({
            token,
            user: {
              id: user.id,
              username: user.username
            }
          });
          resolve();
        });
      });
    }

    if (url.includes('/auth/verify') && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token bulunamadı' });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
      } catch (error) {
        res.status(401).json({ message: 'Geçersiz token' });
      }
      return;
    }

    // Leagues endpoints
    if (url === '/api/leagues' && req.method === 'GET') {
      return new Promise((resolve) => {
        db.all('SELECT * FROM leagues ORDER BY created_at DESC', [], (err, leagues) => {
          if (err) {
            res.status(500).json({ message: 'Veritabanı hatası' });
          } else {
            res.json(leagues);
          }
          resolve();
        });
      });
    }

    if (url === '/api/leagues' && req.method === 'POST') {
      const { name, description } = req.body;

      return new Promise((resolve) => {
        db.run('INSERT INTO leagues (name, description) VALUES (?, ?)', 
               [name, description], function(err) {
          if (err) {
            res.status(500).json({ message: 'Lig oluşturulamadı' });
          } else {
            res.status(201).json({
              id: this.lastID,
              name,
              description,
              created_at: new Date().toISOString()
            });
          }
          resolve();
        });
      });
    }

    // Get specific league with teams
    const leagueIdMatch = url.match(/^\/api\/leagues\/(\d+)$/);
    if (req.method === 'GET' && leagueIdMatch) {
      const leagueId = leagueIdMatch[1];
      
      return new Promise((resolve) => {
        db.get('SELECT * FROM leagues WHERE id = ?', [leagueId], (err, league) => {
          if (err || !league) {
            res.status(404).json({ message: 'Lig bulunamadı' });
            return resolve();
          }
          
          // Takımları da getir
          db.all('SELECT * FROM teams WHERE league_id = ? ORDER BY points DESC, goals_for - goals_against DESC', 
                 [leagueId], (err, teams) => {
            if (err) {
              res.status(500).json({ message: 'Veritabanı hatası' });
            } else {
              res.json({
                ...league,
                teams
              });
            }
            resolve();
          });
        });
      });
    }

    // Teams endpoints
    if (url.includes('/api/teams') && req.method === 'GET' && url.includes('league_id=')) {
      const urlObj = new URL(url, `http://${req.headers.host}`);
      const leagueId = urlObj.searchParams.get('league_id');
      
      return new Promise((resolve) => {
        db.all('SELECT * FROM teams WHERE league_id = ? ORDER BY points DESC, goals_for - goals_against DESC', 
               [leagueId], (err, teams) => {
          if (err) {
            res.status(500).json({ message: 'Veritabanı hatası' });
          } else {
            res.json(teams);
          }
          resolve();
        });
      });
    }

    if (url === '/api/teams' && req.method === 'POST') {
      const { league_id, name, logo_color1, logo_color2 } = req.body;

      return new Promise((resolve) => {
        db.run('INSERT INTO teams (league_id, name, logo_color1, logo_color2) VALUES (?, ?, ?, ?)', 
               [league_id, name, logo_color1 || '#FF0000', logo_color2 || '#0000FF'], function(err) {
          if (err) {
            res.status(500).json({ message: 'Takım eklenemedi' });
          } else {
            res.status(201).json({
              id: this.lastID,
              league_id,
              name,
              logo_color1: logo_color1 || '#FF0000',
              logo_color2: logo_color2 || '#0000FF',
              points: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0
            });
          }
          resolve();
        });
      });
    }

    if (url === '/api/teams/generate-fixtures' && req.method === 'POST') {
      const { league_id } = req.body;

      return new Promise((resolve) => {
        // Önce takımları getir
        db.all('SELECT * FROM teams WHERE league_id = ?', [league_id], (err, teams) => {
          if (err || teams.length < 2) {
            res.status(400).json({ message: 'En az 2 takım gerekli' });
            return resolve();
          }

          // Fikstürü oluştur
          const fixtures = [];
          for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
              fixtures.push({
                league_id: league_id,
                home_team_id: teams[i].id,
                away_team_id: teams[j].id,
                round_number: 1
              });
            }
          }
          
          // Mevcut maçları sil
          db.run('DELETE FROM matches WHERE league_id = ?', [league_id], (err) => {
            if (err) {
              res.status(500).json({ message: 'Önceki maçlar silinemedi' });
              return resolve();
            }

            // Yeni maçları ekle
            let completed = 0;
            if (fixtures.length === 0) {
              res.json({ message: 'Fikstür oluşturuldu', matches_count: 0 });
              return resolve();
            }

            fixtures.forEach(fixture => {
              db.run(`INSERT INTO matches (league_id, home_team_id, away_team_id, round_number) 
                     VALUES (?, ?, ?, ?)`, 
                     [fixture.league_id, fixture.home_team_id, fixture.away_team_id, fixture.round_number],
                     (err) => {
                completed++;
                if (completed === fixtures.length) {
                  res.json({ message: 'Fikstür oluşturuldu', matches_count: fixtures.length });
                  resolve();
                }
              });
            });
          });
        });
      });
    }

    // Matches endpoints
    if (url.includes('/api/matches') && req.method === 'GET' && url.includes('league_id=')) {
      const urlObj = new URL(url, `http://${req.headers.host}`);
      const leagueId = urlObj.searchParams.get('league_id');
      
      return new Promise((resolve) => {
        db.all(`SELECT m.*, 
                       ht.name as home_team_name, ht.logo_color1 as home_color1, ht.logo_color2 as home_color2,
                       at.name as away_team_name, at.logo_color1 as away_color1, at.logo_color2 as away_color2
                FROM matches m
                JOIN teams ht ON m.home_team_id = ht.id
                JOIN teams at ON m.away_team_id = at.id
                WHERE m.league_id = ?
                ORDER BY m.round_number, m.id`, 
               [leagueId], (err, matches) => {
          if (err) {
            res.status(500).json({ message: 'Veritabanı hatası' });
          } else {
            res.json(matches);
          }
          resolve();
        });
      });
    }

    // Update match result
    const matchIdMatch = url.match(/^\/api\/matches\/(\d+)$/);
    if (req.method === 'PUT' && matchIdMatch) {
      const matchId = matchIdMatch[1];
      const { home_score, away_score, match_date, venue, weather } = req.body;

      return new Promise((resolve) => {
        // Önce maç bilgilerini getir
        db.get('SELECT * FROM matches WHERE id = ?', [matchId], (err, match) => {
          if (err || !match) {
            res.status(404).json({ message: 'Maç bulunamadı' });
            return resolve();
          }

          // Maç sonucunu güncelle
          db.run(`UPDATE matches SET 
                    home_score = ?, away_score = ?, match_date = ?, venue = ?, weather = ?, is_completed = 1
                  WHERE id = ?`, 
                 [home_score, away_score, match_date, venue, weather, matchId], (err) => {
            if (err) {
              res.status(500).json({ message: 'Maç güncellenemedi' });
              return resolve();
            }

            // Takım istatistiklerini güncelle
            const homeWin = home_score > away_score;
            const awayWin = away_score > home_score;
            const draw = home_score === away_score;

            const homePointsToAdd = draw ? 1 : (homeWin ? 3 : 0);
            const homeWinsToAdd = homeWin ? 1 : 0;
            const homeDrawsToAdd = draw ? 1 : 0;
            const homeLossesToAdd = awayWin ? 1 : 0;

            const awayPointsToAdd = draw ? 1 : (awayWin ? 3 : 0);
            const awayWinsToAdd = awayWin ? 1 : 0;
            const awayDrawsToAdd = draw ? 1 : 0;
            const awayLossesToAdd = homeWin ? 1 : 0;

            // Ev sahibi takımı güncelle
            db.run(`UPDATE teams SET 
                      points = points + ?, 
                      wins = wins + ?, 
                      draws = draws + ?, 
                      losses = losses + ?,
                      goals_for = goals_for + ?,
                      goals_against = goals_against + ?
                    WHERE id = ?`, 
                   [homePointsToAdd, homeWinsToAdd, homeDrawsToAdd, homeLossesToAdd, home_score, away_score, match.home_team_id], (err) => {
              if (err) {
                res.status(500).json({ message: 'Ev sahibi takım istatistikleri güncellenemedi' });
                return resolve();
              }

              // Deplasman takımını güncelle
              db.run(`UPDATE teams SET 
                        points = points + ?, 
                        wins = wins + ?, 
                        draws = draws + ?, 
                        losses = losses + ?,
                        goals_for = goals_for + ?,
                        goals_against = goals_against + ?
                      WHERE id = ?`, 
                     [awayPointsToAdd, awayWinsToAdd, awayDrawsToAdd, awayLossesToAdd, away_score, home_score, match.away_team_id], (err) => {
                if (err) {
                  res.status(500).json({ message: 'Deplasman takım istatistikleri güncellenemedi' });
                } else {
                  res.json({ message: 'Maç sonucu güncellendi' });
                }
                resolve();
              });
            });
          });
        });
      });
    }

    // Default response
    res.status(404).json({ message: 'Endpoint bulunamadı', url: url, method: req.method });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};
