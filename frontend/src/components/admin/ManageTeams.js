import React, { useState, useEffect } from 'react';
import api from '../../api';

function ManageTeams({ league, onBack }) {
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    color1: '#FF0000',
    color2: '#0000FF'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchTeams = async () => {
    try {
      const response = await api.get(`/api/teams?league_id=${league.id}`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (teams.length >= league.team_count) {
      setMessage(`Bu ligde maksimum ${league.team_count} takım olabilir!`);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/api/teams', {
        ...formData,
        league_id: league.id
      });
      setMessage('Takım başarıyla eklendi!');
      setFormData({ name: '', color1: '#FF0000', color2: '#0000FF' });
      fetchTeams();
    } catch (error) {
      setMessage('Takım eklenirken bir hata oluştu!');
      console.error('Error adding team:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId) => {
    if (window.confirm('Bu takımı silmek istediğinizden emin misiniz? Tüm maçları da silinecek!')) {
      try {
        await api.delete(`/api/teams/${teamId}`);
        fetchTeams();
        setMessage('Takım başarıyla silindi!');
      } catch (error) {
        console.error('Error deleting team:', error);
        setMessage('Takım silinirken bir hata oluştu!');
      }
    }
  };

  const generateFixture = async () => {
    if (teams.length < 2) {
      setMessage('Fikstür oluşturmak için en az 2 takım gerekli!');
      return;
    }

    if (window.confirm('Yeni fikstür oluşturulacak. Mevcut fikstür silinecek. Devam etmek istiyor musunuz?')) {
      try {
        setLoading(true);
        await api.post('/api/teams/generate-fixtures', {
          league_id: league.id
        });
        setMessage('Fikstür başarıyla oluşturuldu!');
      } catch (error) {
        console.error('Error generating fixture:', error);
        setMessage('Fikstür oluşturulurken bir hata oluştu!');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderTeamLogo = (color1, color2, size = 40) => {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: `linear-gradient(45deg, ${color1} 50%, ${color2} 50%)`,
          borderRadius: '50%',
          display: 'inline-block',
          marginRight: '10px',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      />
    );
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>👥 {league.name} - Takım Yönetimi</h2>
          <button className="btn" onClick={onBack}>⬅️ Geri</button>
        </div>

        {message && (
          <div className={`alert ${message.includes('başarıyla') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <strong>Takım Durumu:</strong> {teams.length} / {league.team_count}
        </div>

        {teams.length < league.team_count && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <h3>🆕 Yeni Takım Ekle</h3>
            
            <div className="form-group">
              <label htmlFor="team_name">Takım Adı:</label>
              <input
                type="text"
                id="team_name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Örn: Galatasaray, Fenerbahçe, Ahmet'in Takımı"
              />
            </div>

            <div className="form-group">
              <label>Takım Renkleri:</label>
              <div className="color-picker">
                <div>
                  <label htmlFor="color1">1. Renk:</label>
                  <input
                    type="color"
                    id="color1"
                    name="color1"
                    className="color-input"
                    value={formData.color1}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="color2">2. Renk:</label>
                  <input
                    type="color"
                    id="color2"
                    name="color2"
                    className="color-input"
                    value={formData.color2}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label>Önizleme:</label>
                  {renderTeamLogo(formData.color1, formData.color2, 50)}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Ekleniyor...' : 'Takım Ekle'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            className="btn btn-warning"
            onClick={generateFixture}
            disabled={loading || teams.length < 2}
          >
            🗓️ Fikstür Oluştur
          </button>
        </div>

        <h3>📋 Takım Listesi</h3>
        {teams.length === 0 ? (
          <div className="alert alert-info">
            Bu ligde henüz takım bulunmuyor.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Takım Adı</th>
                <th>Renkler</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id}>
                  <td>{renderTeamLogo(team.color1, team.color2)}</td>
                  <td><strong>{team.name}</strong></td>
                  <td>
                    <span style={{ color: team.color1 }}>●</span>
                    <span style={{ color: team.color2 }}>●</span>
                    <small style={{ marginLeft: '10px' }}>
                      {team.color1} / {team.color2}
                    </small>
                  </td>
                  <td>
                    <button 
                      className="btn btn-danger"
                      onClick={() => deleteTeam(team.id)}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ManageTeams;
