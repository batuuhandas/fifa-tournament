import React, { useState, useEffect } from 'react';
import api from '../../api';

function ManageMatches({ league, onBack }) {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [formData, setFormData] = useState({
    team1_score: '',
    team2_score: '',
    match_date: '',
    venue: '',
    weather: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const venues = ['Merkez Stadı', 'Şehir Stadı', 'Olimpiyat Stadı', 'Gençlik Stadı', 'Spor Kompleksi'];
  const weathers = ['Güneşli', 'Bulutlu', 'Yağmurlu', 'Rüzgarlı', 'Karlı'];

  const fetchMatches = async () => {
    try {
      const response = await api.get(`/api/matches?league_id=${league.id}`);
      console.log('Matches API response:', response.data);
      const matchesData = response.data;
      
      // Ensure we always set an array
      if (Array.isArray(matchesData)) {
        setMatches(matchesData);
      } else {
        console.warn('Matches data is not an array:', matchesData);
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    }
  };

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league.id]);

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    const matchDate = new Date(match.match_date);
    const formattedDate = matchDate.toISOString().slice(0, 16);
    
    setFormData({
      team1_score: match.team1_score !== null ? match.team1_score : '',
      team2_score: match.team2_score !== null ? match.team2_score : '',
      match_date: formattedDate,
      venue: match.venue || '',
      weather: match.weather || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setLoading(true);
    setMessage('');

    try {
      const updateData = {
        ...formData,
        team1_score: formData.team1_score !== '' ? parseInt(formData.team1_score) : null,
        team2_score: formData.team2_score !== '' ? parseInt(formData.team2_score) : null
      };

      if (updateData.team1_score !== null && updateData.team2_score !== null) {
        // Update match result
        await api.put(`/api/matches/${selectedMatch.id}/result`, updateData);
        setMessage('Maç sonucu başarıyla güncellendi!');
      } else {
        // Update match schedule only
        await api.put(`/api/matches/${selectedMatch.id}/schedule`, {
          match_date: updateData.match_date,
          venue: updateData.venue,
          weather: updateData.weather
        });
        setMessage('Maç programı başarıyla güncellendi!');
      }

      fetchMatches();
      setSelectedMatch(null);
      setFormData({
        team1_score: '',
        team2_score: '',
        match_date: '',
        venue: '',
        weather: ''
      });
    } catch (error) {
      setMessage('Maç güncellenirken bir hata oluştu!');
      console.error('Error updating match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const renderTeamLogo = (color1, color2, size = 30) => {
    return (
      <div
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

  const groupMatchesByWeek = (matches) => {
    const grouped = {};
    matches.forEach(match => {
      const week = match.week || 1;
      if (!grouped[week]) {
        grouped[week] = [];
      }
      grouped[week].push(match);
    });
    return grouped;
  };

  const groupedMatches = groupMatchesByWeek(matches);

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>⚽ {league.name} - Maç Yönetimi</h2>
          <button className="btn" onClick={onBack}>⬅️ Geri</button>
        </div>

        {message && (
          <div className={`alert ${message.includes('başarıyla') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="alert alert-info">
            Bu ligde henüz fikstür oluşturulmamış. Önce takım ekleyip fikstür oluşturun.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedMatch ? '1fr 1fr' : '1fr', gap: '2rem' }}>
            {/* Matches List */}
            <div>
              <h3>📅 Maç Listesi</h3>
              {Object.keys(groupedMatches)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(week => (
                <div key={week} style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#1e3c72', borderBottom: '2px solid #1e3c72', paddingBottom: '0.5rem' }}>
                    {week}. Hafta
                  </h4>
                  {groupedMatches[week].map(match => (
                    <div 
                      key={match.id} 
                      className={`match-card ${selectedMatch && selectedMatch.id === match.id ? 'selected' : ''}`}
                      style={{ 
                        cursor: 'pointer',
                        border: selectedMatch && selectedMatch.id === match.id ? '2px solid #667eea' : '1px solid #e1e5e9'
                      }}
                      onClick={() => handleMatchSelect(match)}
                    >
                      <div className="match-teams">
                        <div className="team-info">
                          {renderTeamLogo(match.team1_color1, match.team1_color2)}
                          <span>{match.team1_name}</span>
                        </div>
                        <div className="match-score">
                          {match.status === 'completed' ? (
                            `${match.team1_score} - ${match.team2_score}`
                          ) : (
                            'vs'
                          )}
                        </div>
                        <div className="team-info">
                          {renderTeamLogo(match.team2_color1, match.team2_color2)}
                          <span>{match.team2_name}</span>
                        </div>
                      </div>
                      <div className="match-details">
                        <div><strong>Tarih:</strong> {formatDate(match.match_date)}</div>
                        <div><strong>Saha:</strong> {match.venue}</div>
                        <div><strong>Hava:</strong> {match.weather}</div>
                        <div className={`match-status ${match.status}`}>
                          {match.status === 'completed' ? '✅ Tamamlandı' : '⏳ Planlandı'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Match Edit Form */}
            {selectedMatch && (
              <div>
                <h3>✏️ Maç Düzenle</h3>
                <div className="card" style={{ background: '#f8f9fa' }}>
                  <h4>
                    {renderTeamLogo(selectedMatch.team1_color1, selectedMatch.team1_color2)}
                    {selectedMatch.team1_name}
                    {' vs '}
                    {renderTeamLogo(selectedMatch.team2_color1, selectedMatch.team2_color2)}
                    {selectedMatch.team2_name}
                  </h4>

                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Skor:</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                          type="number"
                          name="team1_score"
                          className="form-control"
                          value={formData.team1_score}
                          onChange={handleChange}
                          placeholder={selectedMatch.team1_name}
                          min="0"
                          max="20"
                          style={{ width: '80px', textAlign: 'center' }}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          name="team2_score"
                          className="form-control"
                          value={formData.team2_score}
                          onChange={handleChange}
                          placeholder={selectedMatch.team2_name}
                          min="0"
                          max="20"
                          style={{ width: '80px', textAlign: 'center' }}
                        />
                      </div>
                      <small style={{ color: '#666' }}>
                        Skor girmezseniz sadece tarih/saha/hava bilgileri güncellenecek
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="match_date">Tarih ve Saat:</label>
                      <input
                        type="datetime-local"
                        id="match_date"
                        name="match_date"
                        className="form-control"
                        value={formData.match_date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="venue">Saha:</label>
                      <select
                        id="venue"
                        name="venue"
                        className="form-control"
                        value={formData.venue}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Saha Seçin</option>
                        {venues.map(venue => (
                          <option key={venue} value={venue}>{venue}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="weather">Hava Durumu:</label>
                      <select
                        id="weather"
                        name="weather"
                        className="form-control"
                        value={formData.weather}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Hava Durumu Seçin</option>
                        {weathers.map(weather => (
                          <option key={weather} value={weather}>{weather}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button 
                        type="submit" 
                        className="btn btn-success"
                        disabled={loading}
                      >
                        {loading ? 'Güncelleniyor...' : 'Güncelle'}
                      </button>
                      <button 
                        type="button" 
                        className="btn"
                        onClick={() => setSelectedMatch(null)}
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageMatches;
