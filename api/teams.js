const { initDatabase, getDatabase } = require('./db');

// Fikstür oluşturma fonksiyonu
function generateFixtures(teams, leagueId) {
  const fixtures = [];
  let matchId = 1;
  
  // Round-robin tournament
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        league_id: leagueId,
        home_team_id: teams[i].id,
        away_team_id: teams[j].id,
        round_number: Math.floor(matchId / (teams.length / 2)) + 1
      });
      matchId++;
    }
  }
  
  return fixtures;
}

// Serverless function handler
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
    await initDatabase();
    const db = getDatabase();

    // GET /api/teams?league_id=X - Lig takımlarını getir
    if (req.method === 'GET' && req.url.startsWith('/api/teams')) {
      const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
      const leagueId = urlParams.get('league_id');
      
      // Tek takım getir
      if (req.url.match(/\/api\/teams\/(\d+)$/)) {
        const teamId = req.url.split('/').pop();
        return new Promise((resolve) => {
          db.get('SELECT * FROM teams WHERE id = ?', [teamId], (err, team) => {
            if (err) {
              return res.status(500).json({ message: 'Veritabanı hatası' });
            }
            if (!team) {
              return res.status(404).json({ message: 'Takım bulunamadı!' });
            }
            res.json(team);
            resolve();
          });
        });
      }
      
      // Lig takımlarını getir
      if (leagueId) {
        return new Promise((resolve) => {
          db.all('SELECT * FROM teams WHERE league_id = ? ORDER BY points DESC, goals_for - goals_against DESC', 
                 [leagueId], (err, teams) => {
            if (err) {
              return res.status(500).json({ message: 'Veritabanı hatası' });
            }
            res.json(teams);
            resolve();
          });
        });
      }
      
      return res.status(400).json({ message: 'Geçersiz istek' });
    }

    // POST /api/teams - Yeni takım ekle
    if (req.method === 'POST' && req.url === '/api/teams') {
      const { league_id, name, logo_color1, logo_color2 } = req.body;

      return new Promise((resolve) => {
        db.run('INSERT INTO teams (league_id, name, logo_color1, logo_color2) VALUES (?, ?, ?, ?)', 
               [league_id, name, logo_color1 || '#FF0000', logo_color2 || '#0000FF'], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Takım eklenemedi' });
          }
          
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
          resolve();
        });
      });
    }

    // POST /api/teams/generate-fixtures - Fikstür oluştur
    if (req.method === 'POST' && req.url === '/api/teams/generate-fixtures') {
      const { league_id } = req.body;

      return new Promise((resolve) => {
        // Önce takımları getir
        db.all('SELECT * FROM teams WHERE league_id = ?', [league_id], (err, teams) => {
          if (err || teams.length < 2) {
            return res.status(400).json({ message: 'En az 2 takım gerekli' });
          }

          // Fikstürü oluştur
          const fixtures = generateFixtures(teams, league_id);
          
          // Mevcut maçları sil
          db.run('DELETE FROM matches WHERE league_id = ?', [league_id], (err) => {
            if (err) {
              return res.status(500).json({ message: 'Önceki maçlar silinemedi' });
            }

            // Yeni maçları ekle
            const insertPromises = fixtures.map(fixture => {
              return new Promise((resolveMatch) => {
                db.run(`INSERT INTO matches (league_id, home_team_id, away_team_id, round_number) 
                       VALUES (?, ?, ?, ?)`, 
                       [fixture.league_id, fixture.home_team_id, fixture.away_team_id, fixture.round_number],
                       (err) => {
                  resolveMatch(err);
                });
              });
            });

            Promise.all(insertPromises).then(() => {
              res.json({ message: 'Fikstür oluşturuldu', matches_count: fixtures.length });
              resolve();
            }).catch(() => {
              res.status(500).json({ message: 'Maçlar oluşturulamadı' });
              resolve();
            });
          });
        });
      });
    }

  } catch (error) {
    console.error('Teams error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
