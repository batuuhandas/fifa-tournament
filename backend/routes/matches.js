const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

// Database path - production vs development
const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../database/tournament.db')
  : './database/tournament.db';

console.log('Matches route - Database path:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Matches route - Database connection error:', err);
  } else {
    console.log('Matches route - Database connected successfully');
  }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fifa25-tournament-secret-key-2024');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Generate fixture for league
router.post('/generate-fixture', verifyToken, (req, res) => {
  const { league_id } = req.body;

  // Get teams for the league
  db.all("SELECT * FROM teams WHERE league_id = ?", [league_id], (err, teams) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch teams' });
    }

    if (teams.length < 2) {
      return res.status(400).json({ error: 'At least 2 teams required for fixture' });
    }

    // Generate round-robin fixture
    const matches = generateRoundRobinFixture(teams, league_id);
    
    // Insert matches into database
    const stmt = db.prepare(`
      INSERT INTO matches (league_id, team1_id, team2_id, match_date, venue, weather, week, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `);

    matches.forEach(match => {
      stmt.run([
        match.league_id,
        match.team1_id,
        match.team2_id,
        match.match_date,
        match.venue,
        match.weather,
        match.week
      ]);
    });

    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to generate fixture' });
      }
      res.json({ message: 'Fixture generated successfully', matches: matches.length });
    });
  });
});

// Helper function to generate round-robin fixture
function generateRoundRobinFixture(teams, league_id) {
  const matches = [];
  const venues = ['Merkez Stadı', 'Şehir Stadı', 'Olimpiyat Stadı', 'Gençlik Stadı', 'Spor Kompleksi'];
  const weathers = ['Güneşli', 'Bulutlu', 'Yağmurlu', 'Rüzgarlı', 'Karlı'];
  
  let week = 1;
  let matchesThisWeek = 0;
  const maxMatchesPerWeek = Math.ceil(teams.length / 2);

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      if (matchesThisWeek >= maxMatchesPerWeek) {
        week++;
        matchesThisWeek = 0;
      }

      // Generate random date (next 2-3 months)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + 3);
      
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      randomDate.setHours(Math.floor(Math.random() * 12) + 10, Math.floor(Math.random() * 60), 0, 0);

      matches.push({
        league_id,
        team1_id: teams[i].id,
        team2_id: teams[j].id,
        match_date: randomDate.toISOString(),
        venue: venues[Math.floor(Math.random() * venues.length)],
        weather: weathers[Math.floor(Math.random() * weathers.length)],
        week
      });

      matchesThisWeek++;
    }
  }

  return matches;
}

// Get matches by league
router.get('/league/:leagueId', (req, res) => {
  const { leagueId } = req.params;

  const query = `
    SELECT 
      m.*,
      t1.name as team1_name,
      t1.color1 as team1_color1,
      t1.color2 as team1_color2,
      t2.name as team2_name,
      t2.color1 as team2_color1,
      t2.color2 as team2_color2
    FROM matches m
    JOIN teams t1 ON m.team1_id = t1.id
    JOIN teams t2 ON m.team2_id = t2.id
    WHERE m.league_id = ?
    ORDER BY m.match_date ASC
  `;

  db.all(query, [leagueId], (err, matches) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch matches' });
    }
    res.json(matches);
  });
});

// Update match result
router.put('/:id/result', verifyToken, (req, res) => {
  const { id } = req.params;
  const { team1_score, team2_score, match_date, venue, weather } = req.body;

  db.run(
    `UPDATE matches 
     SET team1_score = ?, team2_score = ?, match_date = ?, venue = ?, weather = ?, status = 'completed'
     WHERE id = ?`,
    [team1_score, team2_score, match_date, venue, weather, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update match result' });
      }
      res.json({ message: 'Match result updated successfully' });
    }
  );
});

// Update match schedule
router.put('/:id/schedule', verifyToken, (req, res) => {
  const { id } = req.params;
  const { match_date, venue, weather } = req.body;

  db.run(
    "UPDATE matches SET match_date = ?, venue = ?, weather = ? WHERE id = ?",
    [match_date, venue, weather, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update match schedule' });
      }
      res.json({ message: 'Match schedule updated successfully' });
    }
  );
});

// Get match by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      m.*,
      t1.name as team1_name,
      t1.color1 as team1_color1,
      t1.color2 as team1_color2,
      t2.name as team2_name,
      t2.color1 as team2_color1,
      t2.color2 as team2_color2
    FROM matches m
    JOIN teams t1 ON m.team1_id = t1.id
    JOIN teams t2 ON m.team2_id = t2.id
    WHERE m.id = ?
  `;

  db.get(query, [id], (err, match) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch match' });
    }
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  });
});

// Delete match
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM matches WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete match' });
    }
    res.json({ message: 'Match deleted successfully' });
  });
});

module.exports = router;
