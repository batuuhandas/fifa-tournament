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

    // GET /api/matches?league_id=X - Lig maçlarını getir
    if (req.method === 'GET' && req.url.startsWith('/api/matches')) {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const leagueId = urlParams.get('league_id');
      
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
            return res.status(500).json({ message: 'Veritabanı hatası' });
          }
          res.json(matches);
          resolve();
        });
      });
    }

    // PUT /api/matches/:id - Maç sonucu güncelle
    if (req.method === 'PUT' && req.url.startsWith('/api/matches/')) {
      const matchId = req.url.split('/')[3];
      const { home_score, away_score, match_date, venue, weather } = req.body;

      return new Promise((resolve) => {
        // Önce maç bilgilerini getir
        db.get('SELECT * FROM matches WHERE id = ?', [matchId], (err, match) => {
          if (err || !match) {
            return res.status(404).json({ message: 'Maç bulunamadı' });
          }

          // Maç sonucunu güncelle
          db.run(`UPDATE matches SET 
                    home_score = ?, away_score = ?, match_date = ?, venue = ?, weather = ?, is_completed = 1
                  WHERE id = ?`, 
                 [home_score, away_score, match_date, venue, weather, matchId], (err) => {
            if (err) {
              return res.status(500).json({ message: 'Maç güncellenemedi' });
            }

            // Takım istatistiklerini güncelle
            const homeWin = home_score > away_score;
            const awayWin = away_score > home_score;
            const draw = home_score === away_score;

            // Ev sahibi takım istatistikleri
            let homePointsToAdd = draw ? 1 : (homeWin ? 3 : 0);
            let homeWinsToAdd = homeWin ? 1 : 0;
            let homeDrawsToAdd = draw ? 1 : 0;
            let homeLossesToAdd = awayWin ? 1 : 0;

            // Deplasman takım istatistikleri
            let awayPointsToAdd = draw ? 1 : (awayWin ? 3 : 0);
            let awayWinsToAdd = awayWin ? 1 : 0;
            let awayDrawsToAdd = draw ? 1 : 0;
            let awayLossesToAdd = homeWin ? 1 : 0;

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
                return res.status(500).json({ message: 'Ev sahibi takım istatistikleri güncellenemedi' });
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
                  return res.status(500).json({ message: 'Deplasman takım istatistikleri güncellenemedi' });
                }

                res.json({ message: 'Maç sonucu güncellendi' });
                resolve();
              });
            });
          });
        });
      });
    }

  } catch (error) {
    console.error('Matches error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
