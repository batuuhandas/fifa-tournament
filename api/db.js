const { createClient } = require('@supabase/supabase-js');

// Geçici olarak in-memory SQLite kullanalım (test için)
const sqlite3 = require('sqlite3').verbose();

let db = null;

function initDatabase() {
  return new Promise((resolve, reject) => {
    // Memory database - her serverless çağrıda yeniden oluşur
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Tabloları oluştur
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
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('das', 10);
        
        db.run(`INSERT INTO admin (username, password) VALUES (?, ?)`, 
               ['batuhan', hashedPassword], (err) => {
          if (err) {
            console.error('Admin kullanıcısı oluşturulamadı:', err);
          } else {
            console.log('Admin kullanıcısı oluşturuldu: batuhan/das');
          }
          resolve(db);
        });
      });
    });
  });
}

function getDatabase() {
  return db;
}

module.exports = {
  initDatabase,
  getDatabase
};
