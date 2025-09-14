const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./database/tournament.db');

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

// Create new league
router.post('/', verifyToken, (req, res) => {
  const { name, team_count, rounds } = req.body;

  db.run(
    "INSERT INTO leagues (name, team_count, rounds) VALUES (?, ?, ?)",
    [name, team_count, rounds],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create league' });
      }
      res.json({ id: this.lastID, name, team_count, rounds });
    }
  );
});

// Get all leagues
router.get('/', (req, res) => {
  db.all("SELECT * FROM leagues ORDER BY created_at DESC", (err, leagues) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch leagues' });
    }
    res.json(leagues);
  });
});

// Get league by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM leagues WHERE id = ?", [id], (err, league) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch league' });
    }
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    res.json(league);
  });
});

// Get league standings
router.get('/:id/standings', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      t.id,
      t.name,
      t.color1,
      t.color2,
      COUNT(m.id) as played,
      SUM(CASE 
        WHEN (m.team1_id = t.id AND m.team1_score > m.team2_score) OR 
             (m.team2_id = t.id AND m.team2_score > m.team1_score) 
        THEN 1 ELSE 0 END) as won,
      SUM(CASE 
        WHEN m.team1_score = m.team2_score AND m.status = 'completed'
        THEN 1 ELSE 0 END) as drawn,
      SUM(CASE 
        WHEN (m.team1_id = t.id AND m.team1_score < m.team2_score) OR 
             (m.team2_id = t.id AND m.team2_score < m.team1_score) 
        THEN 1 ELSE 0 END) as lost,
      SUM(CASE 
        WHEN m.team1_id = t.id THEN COALESCE(m.team1_score, 0)
        WHEN m.team2_id = t.id THEN COALESCE(m.team2_score, 0)
        ELSE 0 END) as goals_for,
      SUM(CASE 
        WHEN m.team1_id = t.id THEN COALESCE(m.team2_score, 0)
        WHEN m.team2_id = t.id THEN COALESCE(m.team1_score, 0)
        ELSE 0 END) as goals_against,
      (SUM(CASE 
        WHEN (m.team1_id = t.id AND m.team1_score > m.team2_score) OR 
             (m.team2_id = t.id AND m.team2_score > m.team1_score) 
        THEN 3
        WHEN m.team1_score = m.team2_score AND m.status = 'completed'
        THEN 1 
        ELSE 0 END)) as points
    FROM teams t
    LEFT JOIN matches m ON (m.team1_id = t.id OR m.team2_id = t.id) 
                        AND m.league_id = ? AND m.status = 'completed'
    WHERE t.league_id = ?
    GROUP BY t.id, t.name, t.color1, t.color2
    ORDER BY points DESC, (goals_for - goals_against) DESC, goals_for DESC
  `;

  db.all(query, [id, id], (err, standings) => {
    if (err) {
      console.error('Standings query error:', err);
      return res.status(500).json({ error: 'Failed to fetch standings' });
    }
    res.json(standings);
  });
});

// Delete league
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  // Delete related data first
  db.serialize(() => {
    db.run("DELETE FROM matches WHERE league_id = ?", [id]);
    db.run("DELETE FROM teams WHERE league_id = ?", [id]);
    db.run("DELETE FROM leagues WHERE id = ?", [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete league' });
      }
      res.json({ message: 'League deleted successfully' });
    });
  });
});

module.exports = router;
