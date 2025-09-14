const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fifa-tournament-frontend.vercel.app',
    'https://fifa-tournament-frontend-git-main-batuuhandas.vercel.app',
    'https://fifa-tournament-frontend-batuuhandas.vercel.app',
    'https://fifa-tournament-tracker-g4s695g12.vercel.app',
    'https://fifa-tournament-tracker-bvuzrhim2.vercel.app',
    'https://fifa-tournament-tracker.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// PostgreSQL bağlantısı
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database tables oluştur
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leagues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        league_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        logo_color1 VARCHAR(7) DEFAULT '#FF0000',
        logo_color2 VARCHAR(7) DEFAULT '#0000FF',
        points INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        goals_for INTEGER DEFAULT 0,
        goals_against INTEGER DEFAULT 0,
        FOREIGN KEY (league_id) REFERENCES leagues (id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        league_id INTEGER NOT NULL,
        home_team_id INTEGER NOT NULL,
        away_team_id INTEGER NOT NULL,
        home_score INTEGER,
        away_score INTEGER,
        match_date VARCHAR(255),
        venue VARCHAR(255),
        weather VARCHAR(255),
        is_completed BOOLEAN DEFAULT FALSE,
        round_number INTEGER DEFAULT 1,
        FOREIGN KEY (league_id) REFERENCES leagues (id) ON DELETE CASCADE,
        FOREIGN KEY (home_team_id) REFERENCES teams (id) ON DELETE CASCADE,
        FOREIGN KEY (away_team_id) REFERENCES teams (id) ON DELETE CASCADE
      )
    `);

    // Varsayılan admin kullanıcısı ekle
    const adminExists = await pool.query('SELECT id FROM admin WHERE username = $1', ['batuhan']);
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('das', 10);
      await pool.query('INSERT INTO admin (username, password) VALUES ($1, $2)', ['batuhan', hashedPassword]);
      console.log('Admin kullanıcısı oluşturuldu: batuhan/das');
    }

    console.log('Database başarıyla başlatıldı');
  } catch (error) {
    console.error('Database başlatma hatası:', error);
  }
}

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token bulunamadı' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fifa-secret-key-2025', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query('SELECT * FROM admin WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fifa-secret-key-2025',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// League routes
app.get('/api/leagues', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leagues ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Ligler getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/leagues', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO leagues (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Lig oluşturma hatası:', error);
    res.status(500).json({ message: 'Lig oluşturulamadı' });
  }
});

app.get('/api/leagues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const leagueResult = await pool.query('SELECT * FROM leagues WHERE id = $1', [id]);
    if (leagueResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lig bulunamadı' });
    }

    const teamsResult = await pool.query(
      'SELECT * FROM teams WHERE league_id = $1 ORDER BY points DESC, goals_for - goals_against DESC',
      [id]
    );

    res.json({
      ...leagueResult.rows[0],
      teams: teamsResult.rows
    });
  } catch (error) {
    console.error('Lig detay hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Team routes
app.get('/api/teams', async (req, res) => {
  try {
    const { league_id } = req.query;
    const result = await pool.query(
      'SELECT * FROM teams WHERE league_id = $1 ORDER BY points DESC, goals_for - goals_against DESC',
      [league_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Takımlar getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/teams', authenticateToken, async (req, res) => {
  try {
    const { league_id, name, logo_color1, logo_color2 } = req.body;
    const result = await pool.query(
      'INSERT INTO teams (league_id, name, logo_color1, logo_color2) VALUES ($1, $2, $3, $4) RETURNING *',
      [league_id, name, logo_color1 || '#FF0000', logo_color2 || '#0000FF']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Takım ekleme hatası:', error);
    res.status(500).json({ message: 'Takım eklenemedi' });
  }
});

app.post('/api/teams/generate-fixtures', authenticateToken, async (req, res) => {
  try {
    const { league_id } = req.body;
    
    const teamsResult = await pool.query('SELECT * FROM teams WHERE league_id = $1', [league_id]);
    const teams = teamsResult.rows;

    if (teams.length < 2) {
      return res.status(400).json({ message: 'En az 2 takım gerekli' });
    }

    // Mevcut maçları sil
    await pool.query('DELETE FROM matches WHERE league_id = $1', [league_id]);

    // Fikstür oluştur
    const fixtures = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push([league_id, teams[i].id, teams[j].id, 1]);
      }
    }

    // Maçları ekle
    for (const fixture of fixtures) {
      await pool.query(
        'INSERT INTO matches (league_id, home_team_id, away_team_id, round_number) VALUES ($1, $2, $3, $4)',
        fixture
      );
    }

    res.json({ message: 'Fikstür oluşturuldu', matches_count: fixtures.length });
  } catch (error) {
    console.error('Fikstür oluşturma hatası:', error);
    res.status(500).json({ message: 'Fikstür oluşturulamadı' });
  }
});

// Match routes
app.get('/api/matches', async (req, res) => {
  try {
    const { league_id } = req.query;
    const result = await pool.query(`
      SELECT m.*, 
             ht.name as home_team_name, ht.logo_color1 as home_color1, ht.logo_color2 as home_color2,
             at.name as away_team_name, at.logo_color1 as away_color1, at.logo_color2 as away_color2
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.league_id = $1
      ORDER BY m.round_number, m.id
    `, [league_id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Maçlar getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.put('/api/matches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { home_score, away_score, match_date, venue, weather } = req.body;

    // Maç bilgilerini getir
    const matchResult = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
    const match = matchResult.rows[0];

    if (!match) {
      return res.status(404).json({ message: 'Maç bulunamadı' });
    }

    // Maç sonucunu güncelle
    await pool.query(
      'UPDATE matches SET home_score = $1, away_score = $2, match_date = $3, venue = $4, weather = $5, is_completed = true WHERE id = $6',
      [home_score, away_score, match_date, venue, weather, id]
    );

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
    await pool.query(`
      UPDATE teams SET 
        points = points + $1, 
        wins = wins + $2, 
        draws = draws + $3, 
        losses = losses + $4,
        goals_for = goals_for + $5,
        goals_against = goals_against + $6
      WHERE id = $7
    `, [homePointsToAdd, homeWinsToAdd, homeDrawsToAdd, homeLossesToAdd, home_score, away_score, match.home_team_id]);

    // Deplasman takımını güncelle
    await pool.query(`
      UPDATE teams SET 
        points = points + $1, 
        wins = wins + $2, 
        draws = draws + $3, 
        losses = losses + $4,
        goals_for = goals_for + $5,
        goals_against = goals_against + $6
      WHERE id = $7
    `, [awayPointsToAdd, awayWinsToAdd, awayDrawsToAdd, awayLossesToAdd, away_score, home_score, match.away_team_id]);

    res.json({ message: 'Maç sonucu güncellendi' });
  } catch (error) {
    console.error('Maç güncelleme hatası:', error);
    res.status(500).json({ message: 'Maç güncellenemedi' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
  });
}

startServer().catch(console.error);
