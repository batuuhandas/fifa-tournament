const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Teams endpoint fix - restart - auto deploy trigger
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Database connection
const db = new sqlite3.Database('./database/tournament.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Leagues table
    db.run(`
      CREATE TABLE IF NOT EXISTS leagues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        team_count INTEGER NOT NULL,
        rounds INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active'
      )
    `);

    // Teams table
    db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league_id INTEGER,
        name TEXT NOT NULL,
        color1 TEXT NOT NULL,
        color2 TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (league_id) REFERENCES leagues (id)
      )
    `);

    // Matches table
    db.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league_id INTEGER,
        team1_id INTEGER,
        team2_id INTEGER,
        team1_score INTEGER DEFAULT NULL,
        team2_score INTEGER DEFAULT NULL,
        match_date DATETIME,
        venue TEXT,
        weather TEXT,
        week INTEGER,
        status TEXT DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (league_id) REFERENCES leagues (id),
        FOREIGN KEY (team1_id) REFERENCES teams (id),
        FOREIGN KEY (team2_id) REFERENCES teams (id)
      )
    `);

    // Admin table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `, () => {
      // Insert default admin if not exists
      db.get("SELECT * FROM admin WHERE username = 'batuhan'", (err, row) => {
        if (err) {
          console.error('Error checking admin user:', err);
          return;
        }
        if (!row) {
          const bcrypt = require('bcryptjs');
          const hashedPassword = bcrypt.hashSync('das', 10);
          db.run("INSERT INTO admin (username, password) VALUES (?, ?)", ['batuhan', hashedPassword], (err) => {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('Default admin user created');
            }
          });
        } else {
          console.log('Admin user already exists');
        }
      });
    });
  });
}

// Import routes
const authRoutes = require('./routes/auth');
const leagueRoutes = require('./routes/leagues');
const matchRoutes = require('./routes/matches');

// Teams routes inline (debug için)
const express = require('express');
const teamsRouter = express.Router();

// Teams test endpoint
teamsRouter.get('/test', (req, res) => {
  console.log('Inline teams test endpoint called');
  res.json({ message: 'Inline Teams route is working!', timestamp: new Date() });
});

// Teams by ID endpoint
teamsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  console.log('Teams route called with ID:', id);

  db.get("SELECT * FROM teams WHERE id = ?", [id], (err, team) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch team' });
    }
    if (!team) {
      console.log('Team not found for ID:', id);
      return res.status(404).json({ error: 'Team not found' });
    }

    console.log('Team found:', team);

    // Get match history
    const matchQuery = `
      SELECT 
        m.*,
        t1.name as home_team_name,
        t1.color1 as home_color1,
        t1.color2 as home_color2,
        t2.name as away_team_name,
        t2.color1 as away_color1,
        t2.color2 as away_color2
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.home_team_id = ? OR m.away_team_id = ?
      ORDER BY m.match_date DESC
    `;

    db.all(matchQuery, [id, id], (err, matches) => {
      if (err) {
        console.error('Match query error:', err);
        return res.status(500).json({ error: 'Failed to fetch match history' });
      }
      
      console.log('Matches found:', matches.length);
      res.json({ team, matches });
    });
  });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/teams', teamsRouter);
app.use('/api/matches', matchRoutes);

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
