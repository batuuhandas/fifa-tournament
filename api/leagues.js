const { initDatabase, getDatabase } = require('./db');

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

    // GET /api/leagues - Tüm ligleri getir
    if (req.method === 'GET' && req.url === '/api/leagues') {
      return new Promise((resolve) => {
        db.all('SELECT * FROM leagues ORDER BY created_at DESC', [], (err, leagues) => {
          if (err) {
            return res.status(500).json({ message: 'Veritabanı hatası' });
          }
          res.json(leagues);
          resolve();
        });
      });
    }

    // POST /api/leagues - Yeni lig oluştur
    if (req.method === 'POST' && req.url === '/api/leagues') {
      const { name, description } = req.body;

      return new Promise((resolve) => {
        db.run('INSERT INTO leagues (name, description) VALUES (?, ?)', 
               [name, description], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Lig oluşturulamadı' });
          }
          
          res.status(201).json({
            id: this.lastID,
            name,
            description,
            created_at: new Date().toISOString()
          });
          resolve();
        });
      });
    }

    // GET /api/leagues/:id - Belirli lig detayı
    if (req.method === 'GET' && req.url.startsWith('/api/leagues/')) {
      const leagueId = req.url.split('/')[3];
      
      return new Promise((resolve) => {
        db.get('SELECT * FROM leagues WHERE id = ?', [leagueId], (err, league) => {
          if (err || !league) {
            return res.status(404).json({ message: 'Lig bulunamadı' });
          }
          
          // Takımları da getir
          db.all('SELECT * FROM teams WHERE league_id = ? ORDER BY points DESC, goals_for - goals_against DESC', 
                 [leagueId], (err, teams) => {
            if (err) {
              return res.status(500).json({ message: 'Veritabanı hatası' });
            }
            
            res.json({
              ...league,
              teams
            });
            resolve();
          });
        });
      });
    }

  } catch (error) {
    console.error('Leagues error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
