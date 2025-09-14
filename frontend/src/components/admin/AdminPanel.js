import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CreateLeague from './CreateLeague';
import ManageTeams from './ManageTeams';
import ManageMatches from './ManageMatches';
import axios from 'axios';

function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('leagues');
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/admin');
      return;
    }
    fetchLeagues();
  }, [user, navigate]);

  const fetchLeagues = async () => {
    try {
      const response = await axios.get('/api/leagues');
      setLeagues(response.data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const deleteLeague = async (leagueId) => {
    if (window.confirm('Bu ligi silmek istediğinizden emin misiniz? Tüm takımlar ve maçlar da silinecek!')) {
      try {
        await axios.delete(`/api/leagues/${leagueId}`);
        fetchLeagues();
        if (selectedLeague && selectedLeague.id === leagueId) {
          setSelectedLeague(null);
        }
      } catch (error) {
        console.error('Error deleting league:', error);
        alert('Lig silinirken bir hata oluştu!');
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <div className="admin-panel">
        <h2>🛠️ Admin Paneli</h2>
        <p>Hoş geldin, {user.username}!</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'leagues' ? 'btn-warning' : ''}`}
            onClick={() => setActiveTab('leagues')}
          >
            Lig Yönetimi
          </button>
          <button 
            className={`btn ${activeTab === 'teams' ? 'btn-warning' : ''}`}
            onClick={() => setActiveTab('teams')}
            disabled={!selectedLeague}
          >
            Takım Yönetimi
          </button>
          <button 
            className={`btn ${activeTab === 'matches' ? 'btn-warning' : ''}`}
            onClick={() => setActiveTab('matches')}
            disabled={!selectedLeague}
          >
            Maç Yönetimi
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      {activeTab === 'leagues' && (
        <>
          <CreateLeague onLeagueCreated={fetchLeagues} />
          
          <div className="card">
            <h2>📋 Mevcut Ligler</h2>
            {leagues.length === 0 ? (
              <div className="alert alert-info">
                Henüz hiç lig oluşturulmamış.
              </div>
            ) : (
              <div className="leagues-grid">
                {leagues.map(league => (
                  <div key={league.id} className="league-card">
                    <h3>{league.name}</h3>
                    <p><strong>Takım Sayısı:</strong> {league.team_count}</p>
                    <p><strong>Tur Sayısı:</strong> {league.rounds}</p>
                    <p><strong>Durum:</strong> {league.status === 'active' ? 'Aktif' : 'Tamamlandı'}</p>
                    <div style={{ marginTop: '1rem' }}>
                      <button 
                        className="btn btn-success"
                        onClick={() => {
                          setSelectedLeague(league);
                          setActiveTab('teams');
                        }}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Yönet
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => deleteLeague(league.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'teams' && selectedLeague && (
        <ManageTeams 
          league={selectedLeague} 
          onBack={() => setActiveTab('leagues')}
        />
      )}

      {activeTab === 'matches' && selectedLeague && (
        <ManageMatches 
          league={selectedLeague} 
          onBack={() => setActiveTab('leagues')}
        />
      )}
    </div>
  );
}

export default AdminPanel;
