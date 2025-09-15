import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function LeagueDetail() {
  const { id } = useParams();
  const [league, setLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings');

  const fetchLeagueData = async () => {
    try {
      const [leagueResponse, matchesResponse] = await Promise.all([
        api.get(`/api/leagues/${id}`),
        api.get(`/api/matches?league_id=${id}`)
      ]);
      
      setLeague(leagueResponse.data);
      setStandings(leagueResponse.data.teams || []);
      setMatches(matchesResponse.data);
    } catch (error) {
      console.error('Error fetching league data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const renderTeamLogo = (color1, color2, size = 30) => {
    return (
      <div
        className="team-logo"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(45deg, ${color1} 50%, ${color2} 50%)`,
          borderRadius: '50%',
          display: 'inline-block',
          marginRight: '10px'
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Lig bilgileri yükleniyor...</div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container">
        <div className="alert alert-danger">Lig bulunamadı!</div>
        <Link to="/" className="btn">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>⚽ {league.name}</h1>
        <div className="nav">
          <Link to="/" className="nav-button">Ana Sayfa</Link>
          <button 
            className={`nav-button ${activeTab === 'standings' ? 'active' : ''}`}
            onClick={() => setActiveTab('standings')}
          >
            Puan Durumu
          </button>
          <button 
            className={`nav-button ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Maçlar
          </button>
        </div>
      </div>

      {activeTab === 'standings' && (
        <div className="card">
          <h2>📊 Puan Durumu</h2>
          {standings.length === 0 ? (
            <div className="alert alert-info">
              Henüz maç oynanmamış. Puan durumu güncellenecek.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Takım</th>
                  <th>O</th>
                  <th>G</th>
                  <th>B</th>
                  <th>M</th>
                  <th>A</th>
                  <th>Y</th>
                  <th>Av</th>
                  <th>P</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.id}>
                    <td>{index + 1}</td>
                    <td>
                      {renderTeamLogo(team.logo_color1 || team.color1, team.logo_color2 || team.color2)}
                      <span style={{color: '#1e3c72', fontWeight: '500'}}>
                        {team.name}
                      </span>
                    </td>
                    <td>{team.played}</td>
                    <td>{team.won}</td>
                    <td>{team.drawn}</td>
                    <td>{team.lost}</td>
                    <td>{team.goals_for}</td>
                    <td>{team.goals_against}</td>
                    <td>{team.goals_for - team.goals_against}</td>
                    <td><strong>{team.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="card">
          <h2>⚽ Maçlar</h2>
          {matches.length === 0 ? (
            <div className="alert alert-info">
              Henüz fikstür oluşturulmamış.
            </div>
          ) : (
            <div className="matches-list">
              {matches.map(match => (
                <div key={match.id} className="match-card">
                  <div className="match-teams">
                    <div className="team-info">
                      {renderTeamLogo(match.home_color1, match.home_color2)}
                      <span>{match.home_team_name}</span>
                    </div>
                    <div className="match-score">
                      {match.home_score !== null && match.away_score !== null ? (
                        `${match.home_score} - ${match.away_score}`
                      ) : (
                        'vs'
                      )}
                    </div>
                    <div className="team-info">
                      {renderTeamLogo(match.away_color1, match.away_color2)}
                      <span>{match.away_team_name}</span>
                    </div>
                  </div>
                  {match.home_score !== null && match.away_score !== null ? (
                    <div className="match-status completed">
                      Tamamlandı
                    </div>
                  ) : (
                    <div className="match-status planned">
                      Planlandı
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LeagueDetail;
