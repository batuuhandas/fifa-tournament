import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Tek bir endpoint'ten takım bilgisi ve maç geçmişini al
        const response = await fetch(`https://fifa-tournament-backend.onrender.com/api/teams/${id}`);
        
        if (!response.ok) {
          throw new Error('Team not found');
        }
        
        const data = await response.json();
        setTeam(data.team);
        setMatches(data.matches || []);
        
      } catch (error) {
        console.error('Takım bilgileri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [id]);

  const renderTeamLogo = (color1, color2, size = 30) => {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: `linear-gradient(45deg, ${color1} 50%, ${color2} 50%)`,
          borderRadius: '50%',
          marginRight: size > 30 ? '15px' : '8px',
          display: 'inline-block',
          border: '2px solid #ddd'
        }}
      />
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Yükleniyor...</h2>
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Takım bulunamadı!</h2>
        <Link to="/">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
          {renderTeamLogo(team.color1, team.color2, 60)}
          {team.name}
        </h1>
        <div>
          <Link to="/" style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px',
            marginRight: '10px'
          }}>
            Ana Sayfa
          </Link>
          <Link to={`/league/${team.league_id}`} style={{ 
            padding: '10px 20px', 
            background: '#6c757d', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px'
          }}>
            Liga Dön
          </Link>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>📊 Takım İstatistikleri</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '20px',
          marginTop: '15px'
        }}>
          <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
              {team.wins + team.draws + team.losses}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Oynanan Maç</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
              {team.wins}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Galibiyet</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
              {team.draws}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Beraberlik</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
              {team.losses}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Mağlubiyet</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8' }}>
              {team.points}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Puan</div>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2>⚽ Takım Maçları</h2>
        {matches.length === 0 ? (
          <p>Bu takım için henüz maç bulunmuyor.</p>
        ) : (
          <div style={{ marginTop: '15px' }}>
            {matches.map((match) => (
              <div key={match.id} style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                marginBottom: '10px', 
                borderRadius: '8px',
                borderLeft: '4px solid #007bff'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    {renderTeamLogo(match.home_color1, match.home_color2)}
                    <span>{match.home_team_name}</span>
                  </div>
                  
                  <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    {match.home_score !== null && match.away_score !== null ? (
                      <>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                          {match.home_score} - {match.away_score}
                        </div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#28a745',
                          background: '#d4edda',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          display: 'inline-block'
                        }}>
                          Tamamlandı
                        </div>
                      </>
                    ) : (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#856404',
                        background: '#fff3cd',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        display: 'inline-block'
                      }}>
                        Planlandı
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ marginRight: '8px' }}>{match.away_team_name}</span>
                    {renderTeamLogo(match.away_color1, match.away_color2)}
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#6c757d',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Hafta {match.round_number}</span>
                  {match.match_date && (
                    <span>{new Date(match.match_date).toLocaleDateString('tr-TR')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamDetail;
