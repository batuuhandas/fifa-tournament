import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function TeamDetail() {
  const { id } = useParams();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTeamData = async () => {
    try {
      // Geçici çözüm: Teams endpoint için Vercel API kullan
      const response = await fetch(`/api/teams/${id}`);
      if (!response.ok) {
        throw new Error('Team not found');
      }
      const data = await response.json();
      setTeamData(data);
    } catch (error) {
      console.error('Takım bilgileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchResult = (match, teamId) => {
    if (match.status !== 'completed') return 'Planlandı';
    
    const isTeam1 = match.team1_id === teamId;
    const teamScore = isTeam1 ? match.team1_score : match.team2_score;
    const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
    
    if (teamScore > opponentScore) return 'Galibiyet';
    if (teamScore < opponentScore) return 'Mağlubiyet';
    return 'Beraberlik';
  };

  const getOpponentInfo = (match, teamId) => {
    const isTeam1 = match.team1_id === teamId;
    return {
      name: isTeam1 ? match.team2_name : match.team1_name,
      color1: isTeam1 ? match.team2_color1 : match.team1_color1,
      color2: isTeam1 ? match.team2_color2 : match.team1_color2
    };
  };

  const getScore = (match, teamId) => {
    if (match.status !== 'completed') return '-';
    
    const isTeam1 = match.team1_id === teamId;
    const teamScore = isTeam1 ? match.team1_score : match.team2_score;
    const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
    
    return `${teamScore} - ${opponentScore}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Takım bilgileri yükleniyor...</div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="container">
        <div className="alert alert-danger">Takım bulunamadı!</div>
        <Link to="/" className="btn">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  const { team, matches } = teamData;

  return (
    <div className="container">
      <div className="header">
        <h1>
          {renderTeamLogo(team.color1, team.color2, 60)}
          {team.name}
        </h1>
        <div className="nav">
          <Link to="/" className="nav-button">Ana Sayfa</Link>
          <Link to={`/league/${team.league_id}`} className="nav-button">Liga Dön</Link>
        </div>
      </div>

      <div className="card">
        <h2>📊 Takım İstatistikleri</h2>
        <div className="team-stats">
          <div className="stat-item">
            <div className="stat-value">{matches.filter(m => m.status === 'completed').length}</div>
            <div className="stat-label">Oynadığı Maç</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {matches.filter(m => {
                if (m.status !== 'completed') return false;
                const isTeam1 = m.team1_id === team.id;
                const teamScore = isTeam1 ? m.team1_score : m.team2_score;
                const opponentScore = isTeam1 ? m.team2_score : m.team1_score;
                return teamScore > opponentScore;
              }).length}
            </div>
            <div className="stat-label">Galibiyet</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {matches.filter(m => {
                if (m.status !== 'completed') return false;
                return m.team1_score === m.team2_score;
              }).length}
            </div>
            <div className="stat-label">Beraberlik</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {matches.filter(m => {
                if (m.status !== 'completed') return false;
                const isTeam1 = m.team1_id === team.id;
                const teamScore = isTeam1 ? m.team1_score : m.team2_score;
                const opponentScore = isTeam1 ? m.team2_score : m.team1_score;
                return teamScore < opponentScore;
              }).length}
            </div>
            <div className="stat-label">Mağlubiyet</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>⚽ Maç Geçmişi</h2>
        {matches.length === 0 ? (
          <div className="alert alert-info">
            Bu takımın henüz maçı bulunmuyor.
          </div>
        ) : (
          <div className="matches-list">
            {matches.map(match => {
              const opponent = getOpponentInfo(match, team.id);
              const result = getMatchResult(match, team.id);
              const score = getScore(match, team.id);
              
              return (
                <div key={match.id} className={`match-card ${result.toLowerCase()}`}>
                  <div className="match-teams">
                    <div className="team-info">
                      <span><strong>vs</strong></span>
                    </div>
                    <div className="team-info">
                      {renderTeamLogo(opponent.color1, opponent.color2)}
                      <span>{opponent.name}</span>
                    </div>
                  </div>
                  <div className="match-score">{score}</div>
                  <div className="match-details">
                    <div className={`result-badge ${result.toLowerCase()}`}>
                      {result}
                    </div>
                    <div><strong>Tarih:</strong> {formatDate(match.match_date)}</div>
                    <div><strong>Saha:</strong> {match.venue}</div>
                    <div><strong>Hava:</strong> {match.weather}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamDetail;
