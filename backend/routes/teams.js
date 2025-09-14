const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./database/tournament.db');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Teams route is working!', timestamp: new Date() });
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

// Add team to league
router.post('/', verifyToken, (req, res) => {
  const { league_id, name, color1, color2 } = req.body;

  db.run(
    "INSERT INTO teams (league_id, name, color1, color2) VALUES (?, ?, ?, ?)",
    [league_id, name, color1, color2],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add team' });
      }
      res.json({ id: this.lastID, league_id, name, color1, color2 });
    }
  );
});

// Get teams by league
router.get('/league/:leagueId', (req, res) => {
  const { leagueId } = req.params;

  db.all("SELECT * FROM teams WHERE league_id = ? ORDER BY name", [leagueId], (err, teams) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch teams' });
    }
    res.json(teams);
  });
});

// Get team by ID with match history
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('Teams route called with ID:', id); // Debug log

  db.get("SELECT * FROM teams WHERE id = ?", [id], (err, team) => {
    if (err) {
      console.error('Database error:', err); // Debug log
      return res.status(500).json({ error: 'Failed to fetch team' });
    }
    if (!team) {
      console.log('Team not found for ID:', id); // Debug log
      return res.status(404).json({ error: 'Team not found' });
    }

    console.log('Team found:', team); // Debug log

    // Get match history
    const matchQuery = `
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
      WHERE m.team1_id = ? OR m.team2_id = ?
      ORDER BY m.match_date DESC
    `;

    db.all(matchQuery, [id, id], (err, matches) => {
      if (err) {
        console.error('Match query error:', err); // Debug log
        return res.status(500).json({ error: 'Failed to fetch match history' });
      }
      
      console.log('Matches found:', matches.length); // Debug log
      res.json({ team, matches });
    });
  });
});

// Update team
router.put('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, color1, color2 } = req.body;

  db.run(
    "UPDATE teams SET name = ?, color1 = ?, color2 = ? WHERE id = ?",
    [name, color1, color2, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update team' });
      }
      res.json({ id, name, color1, color2 });
    }
  );
});

// Delete team
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  // Delete related matches first
  db.run("DELETE FROM matches WHERE team1_id = ? OR team2_id = ?", [id, id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete team matches' });
    }

    db.run("DELETE FROM teams WHERE id = ?", [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete team' });
      }
      res.json({ message: 'Team deleted successfully' });
    });
  });
});

module.exports = router;
