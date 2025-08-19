import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playersAPI } from '../api';

const PlayersPage = () => {
    const [players, setPlayers] = useState([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const response = await playersAPI.getAll();
            setPlayers(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch players');
            console.error('Error fetching players:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlayer = async (e) => {
        e.preventDefault();

        if (!newPlayerName.trim()) {
            setError('Player name is required');
            return;
        }

        try {
            await playersAPI.create({ name: newPlayerName.trim() });
            setNewPlayerName('');
            setSuccess('Player added successfully!');
            setError('');
            fetchPlayers();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add player');
            setSuccess('');
        }
    };

    const handleDeletePlayer = async (playerId, playerName) => {
        if (window.confirm(`Are you sure you want to delete ${playerName}? This will also delete all associated match data.`)) {
            try {
                await playersAPI.delete(playerId);
                setSuccess('Player deleted successfully!');
                setError('');
                fetchPlayers();

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to delete player');
                setSuccess('');
            }
        }
    };

    const calculateWinLossRatio = (player) => {
        const totalMatches = player.matches.length;
        if (totalMatches === 0) return { wins: 0, losses: 0, ratio: '0.00' };

        let wins = 0;
        let losses = 0;

        player.matches.forEach(matchPlayer => {
            const match = matchPlayer.match;
            const isWhiteTeam = matchPlayer.team;
            const whiteWon = match.whiteTeamScore > match.blackTeamScore;

            if ((isWhiteTeam && whiteWon) || (!isWhiteTeam && !whiteWon)) {
                wins++;
            } else {
                losses++;
            }
        });

        const ratio = losses > 0 ? (wins / losses).toFixed(2) : wins.toFixed(2);
        return { wins, losses, ratio };
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">Loading players...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Players Management</h1>

            {error && <div className="error">{error}</div>}
            {success && <div className="success" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '10px', margin: '1rem 0', textAlign: 'center' }}>{success}</div>}

            {/* Add Player Form */}
            <div className="card">
                <h2 style={{ marginBottom: '1rem', color: '#333' }}>Add New Player</h2>
                <form onSubmit={handleAddPlayer}>
                    <div className="form-group">
                        <label className="form-label">Player Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            placeholder="Enter player name"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Add Player
                    </button>
                </form>
            </div>

            {/* Players List */}
            <div className="card">
                <h2 style={{ marginBottom: '1rem', color: '#333' }}>All Players ({players.length})</h2>

                {players.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '1.1rem', padding: '2rem' }}>
                        No players found. Add your first player above!
                    </p>
                ) : (
                    <div className="grid grid-2">
                        {players.map(player => {
                            const stats = calculateWinLossRatio(player);
                            const totalGoals = player.goalsScoredWhite + player.goalsScoredBlack;
                            const totalGoalsConceded = player.goalsConcededWhite + player.goalsConcededBlack;

                            return (
                                <div key={player.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, color: '#333', fontSize: '1.3rem' }}>{player.name}</h3>
                                        <button
                                            onClick={() => handleDeletePlayer(player.id, player.name)}
                                            className="btn btn-danger"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Matches Played:</span>
                                        <span className="stat-value">{player.matches.length}</span>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Wins:</span>
                                        <span className="stat-value" style={{ color: '#28a745' }}>{stats.wins}</span>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Losses:</span>
                                        <span className="stat-value" style={{ color: '#dc3545' }}>{stats.losses}</span>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Win/Loss Ratio:</span>
                                        <span className="stat-value" style={{ color: '#007bff' }}>{stats.ratio}</span>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Goals Scored:</span>
                                        <span className="stat-value">{totalGoals}</span>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Goals Conceded:</span>
                                        <span className="stat-value">{totalGoalsConceded}</span>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Player of the Match:</span>
                                        <span className="stat-value" style={{ color: '#ffc107' }}>{player.playerOfTheMatch}</span>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Gamelles Scored:</span>
                                        <span className="stat-value">{player.gamellesScored}</span>
                                    </div>

                                    <div className="stat-item">
                                        <span className="stat-label">Own Goals:</span>
                                        <span className="stat-value">{player.ownGoalsScored}</span>
                                    </div>

                                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                        <Link
                                            to={`/player/${player.id}`}
                                            className="btn btn-secondary"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            View Detailed Stats
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayersPage;