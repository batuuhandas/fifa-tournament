import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Home() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

    const fetchLeagues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/leagues');
      setLeagues(response.data);
    } catch (error) {
      console.error('Ligler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Ligler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>⚽ FIFA 25 Turnuva Takip Sistemi</h1>
        <div className="nav">
          <Link to="/admin" className="nav-button">Admin Girişi</Link>
        </div>
      </div>

      <div className="card">
        <h2>🏆 Aktif Ligler</h2>
        {leagues.length === 0 ? (
          <div className="alert alert-info">
            Henüz hiç lig oluşturulmamış. Admin panelinden yeni lig oluşturabilirsiniz.
          </div>
        ) : (
          <div className="leagues-grid">
            {leagues.map(league => (
              <div key={league.id} className="league-card">
                <h3>{league.name}</h3>
                <p><strong>Takım Sayısı:</strong> {league.team_count}</p>
                <p><strong>Tur Sayısı:</strong> {league.rounds}</p>
                <p><strong>Durum:</strong> <span className={`status ${league.status}`}>{league.status === 'active' ? 'Aktif' : 'Tamamlandı'}</span></p>
                <p><strong>Oluşturulma:</strong> {new Date(league.created_at).toLocaleDateString('tr-TR')}</p>
                <Link to={`/league/${league.id}`} className="btn">Liga Git</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
