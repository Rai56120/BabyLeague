import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PlayersPage from './pages/PlayersPage';
import AddMatchPage from './pages/AddMatchPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import PlayerStatsPage from './pages/PlayerStatsPage';
import RecentMatchesPage from './pages/RecentMatchesPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              ⚽ Table Football
            </Link>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  Recent Matches
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/players" className="nav-link">
                  Players
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/add-match" className="nav-link">
                  Add Match
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<RecentMatchesPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/add-match" element={<AddMatchPage />} />
            <Route path="/match/:id" element={<MatchDetailsPage />} />
            <Route path="/player/:id" element={<PlayerStatsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;