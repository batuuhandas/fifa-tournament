import React, { useState } from 'react';
import api from '../../api';

function CreateLeague({ onLeagueCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    team_count: 8,
    rounds: 1
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/api/leagues', formData);
      setMessage('Lig başarıyla oluşturuldu!');
      setFormData({ name: '', team_count: 8, rounds: 1 });
      onLeagueCreated();
    } catch (error) {
      setMessage('Lig oluşturulurken bir hata oluştu!');
      console.error('Error creating league:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'team_count' || name === 'rounds' ? parseInt(value) : value
    }));
  };

  return (
    <div className="card">
      <h2>🏆 Yeni Lig Oluştur</h2>
      
      {message && (
        <div className={`alert ${message.includes('başarıyla') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Lig Adı:</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Örn: FIFA 25 Arkadaş Ligi"
          />
        </div>

        <div className="form-group">
          <label htmlFor="team_count">Takım Sayısı:</label>
          <select
            id="team_count"
            name="team_count"
            className="form-control"
            value={formData.team_count}
            onChange={handleChange}
            disabled={loading}
          >
            <option value={4}>4 Takım</option>
            <option value={6}>6 Takım</option>
            <option value={8}>8 Takım</option>
            <option value={10}>10 Takım</option>
            <option value={12}>12 Takım</option>
            <option value={16}>16 Takım</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="rounds">Tur Sayısı:</label>
          <select
            id="rounds"
            name="rounds"
            className="form-control"
            value={formData.rounds}
            onChange={handleChange}
            disabled={loading}
          >
            <option value={1}>Tek Tur (Herkes birbirine karşı 1 kez)</option>
            <option value={2}>Çift Tur (İç saha - Dış saha)</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-success"
          disabled={loading}
        >
          {loading ? 'Oluşturuluyor...' : 'Lig Oluştur'}
        </button>
      </form>
    </div>
  );
}

export default CreateLeague;
