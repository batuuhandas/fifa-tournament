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
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/admin');
      return;
    }
    fetchLeagues();
  }, [user, navigate]);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('AdminPanel: Fetching leagues...');
      const response = await axios.get('https://fifa-tournament-backend.onrender.com/api/leagues');
      console.log('AdminPanel: Leagues fetched successfully:', response.data);
      
      const leaguesData = response.data;
      // Ensure we always set an array
      if (Array.isArray(leaguesData)) {
        setLeagues(leaguesData);
      } else {
        console.warn('Leagues data is not an array:', leaguesData);
        setLeagues([]);
      }
    } catch (error) {
      console.error('Ligler yüklenirken hata:', error);
      setError('Ligler yüklenirken hata oluştu');
      setLeagues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueCreated = () => {
    fetchLeagues();
    setActiveTab('leagues');
  };

  const handleDeleteLeague = async (leagueId) => {
    if (window.confirm('Bu ligi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      try {
        setDeleting(leagueId);
        const token = localStorage.getItem('token');
        console.log('Deleting league:', leagueId);
        
        await axios.delete(`https://fifa-tournament-backend.onrender.com/api/leagues/${leagueId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('League deleted successfully');
        alert('Lig başarıyla silindi!');
        fetchLeagues();
        
        if (selectedLeague && selectedLeague.id === leagueId) {
          setSelectedLeague(null);
        }
      } catch (error) {
        console.error('Lig silinirken hata:', error);
        alert('Lig silinirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <div>Yetkilendirme kontrol ediliyor...</div>;
  }

  if (loading) {
    return <div>Veriler yükleniyor...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Hata: {error}</p>
        <button onClick={fetchLeagues}>Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>🔧 Admin Paneli</h1>
        <div className="admin-info">
          <span>Hoş geldin, {user.username}!</span>
          <button onClick={handleLogout} className="btn logout-btn">Çıkış Yap</button>
        </div>
      </div>

      <div className="admin-nav">
        <button 
          className={`nav-button ${activeTab === 'leagues' ? 'active' : ''}`}
          onClick={() => setActiveTab('leagues')}
        >
          Ligler
        </button>
        <button 
          className={`nav-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Lig Oluştur
        </button>
        {selectedLeague && (
          <>
            <button 
              className={`nav-button ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              Takımlar
            </button>
            <button 
              className={`nav-button ${activeTab === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveTab('matches')}
            >
              Maçlar
            </button>
          </>
        )}
      </div>

      {activeTab === 'leagues' && (
        <div className="card">
          <h2>📋 Ligler</h2>
          {!Array.isArray(leagues) || leagues.length === 0 ? (
            <div className="alert alert-info">
              Henüz lig oluşturulmamış. Yeni bir lig oluşturmak için "Lig Oluştur" sekmesine gidin.
            </div>
          ) : (
            <div className="leagues-list">
              {leagues.map(league => (
                <div key={league.id} className="league-item">
                  <div className="league-info">
                    <h3>{league.name}</h3>
                    <p>Takım sayısı: {(league.teams && league.teams.length) || 0}</p>
                  </div>
                  <div className="league-actions">
                    <button 
                      className="btn"
                      onClick={() => setSelectedLeague(league)}
                    >
                      Yönet
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteLeague(league.id)}
                      disabled={deleting === league.id}
                    >
                      {deleting === league.id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedLeague && (
            <div className="selected-league">
              <h3>🎯 Seçili Lig: {selectedLeague.name}</h3>
              <p>Bu lig için takım ve maç yönetimi yapmak üzere yukarıdaki sekmelerden ilgili bölüme geçebilirsiniz.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <CreateLeague onLeagueCreated={handleLeagueCreated} />
      )}

      {activeTab === 'teams' && selectedLeague && (
        <ManageTeams league={selectedLeague} onUpdate={fetchLeagues} />
      )}

      {activeTab === 'matches' && selectedLeague && (
        <ManageMatches league={selectedLeague} />
      )}
    </div>
  );
}

export default AdminPanel;
