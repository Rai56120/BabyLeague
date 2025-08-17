import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { playersAPI, matchesAPI } from '../api';

const AddMatchPage = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Match data
    const [whiteTeamScore, setWhiteTeamScore] = useState(0);
    const [blackTeamScore, setBlackTeamScore] = useState(0);
    const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 16));

    // Players in teams
    const [whiteTeamPlayers, setWhiteTeamPlayers] = useState([]);
    const [blackTeamPlayers, setBlackTeamPlayers] = useState([]);

    // Player selection
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('white');

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
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

    const addPlayerToTeam = () => {
        if (!selectedPlayerId) return;

        const player = players.find(p => p.id === parseInt(selectedPlayerId));
        if (!player) return;

        // Check if player is already in either team
        const isInWhiteTeam = whiteTeamPlayers.some(p => p.id === player.id);
        const isInBlackTeam = blackTeamPlayers.some(p => p.id === player.id);

        if (isInWhiteTeam || isInBlackTeam) {
            setError('Player is already in a team');
            return;
        }

        const playerWithStats = {
            ...player,
            gamellesScored: 0,
            ownGoalScored: 0,
            isPlayerOfTheMatch: false
        };

        if (selectedTeam === 'white') {
            setWhiteTeamPlayers([...whiteTeamPlayers, playerWithStats]);
        } else {
            setBlackTeamPlayers([...blackTeamPlayers, playerWithStats]);
        }

        setSelectedPlayerId('');
        setError('');
    };

    const removePlayerFromTeam = (playerId, team) => {
        if (team === 'white') {
            setWhiteTeamPlayers(whiteTeamPlayers.filter(p => p.id !== playerId));
        } else {
            setBlackTeamPlayers(blackTeamPlayers.filter(p => p.id !== playerId));
        }
    };

    const updatePlayerStat = (playerId, team, stat, value) => {
        const updateTeam = team === 'white' ? setWhiteTeamPlayers : setBlackTeamPlayers;
        const teamPlayers = team === 'white' ? whiteTeamPlayers : blackTeamPlayers;

        updateTeam(teamPlayers.map(player =>
            player.id === playerId
                ? { ...player, [stat]: value }
                : player
        ));
    };

    const getAvailablePlayers = () => {
        const usedPlayerIds = [
            ...whiteTeamPlayers.map(p => p.id),
            ...blackTeamPlayers.map(p => p.id)
        ];
        return players.filter(p => !usedPlayerIds.includes(p.id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (whiteTeamPlayers.length === 0 || blackTeamPlayers.length === 0) {
            setError('Both teams must have at least one player');
            return;
        }

        // Check if only one player is marked as player of the match
        const allPlayers = [...whiteTeamPlayers, ...blackTeamPlayers];
        const playersOfTheMatch = allPlayers.filter(p => p.isPlayerOfTheMatch);

        if (playersOfTheMatch.length > 1) {
            setError('Only one player can be Player of the Match');
            return;
        }

        const matchData = {
            whiteTeamScore: parseInt(whiteTeamScore),
            blackTeamScore: parseInt(blackTeamScore),
            date: matchDate,
            players: [
                ...whiteTeamPlayers.map(player => ({
                    playerId: player.id,
                    team: true,
                    gamellesScored: parseInt(player.gamellesScored) || 0,
                    ownGoalScored: parseInt(player.ownGoalScored) || 0,
                    isPlayerOfTheMatch: player.isPlayerOfTheMatch || false
                })),
                ...blackTeamPlayers.map(player => ({
                    playerId: player.id,
                    team: false,
                    gamellesScored: parseInt(player.gamellesScored) || 0,
                    ownGoalScored: parseInt(player.ownGoalScored) || 0,
                    isPlayerOfTheMatch: player.isPlayerOfTheMatch || false
                }))
            ]
        };

        try {
            setSubmitting(true);
            const response = await matchesAPI.create(matchData);
            navigate(`/match/${response.data.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create match');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">Loading players...</div>
            </div>
        );
    }

    const availablePlayers = getAvailablePlayers();

    return (
        <div className="page-container">
            <h1 className="page-title">Add New Match</h1>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* Match Details */}
                <div className="card">
                    <h2 style={{ marginBottom: '1rem', color: '#333' }}>Match Details</h2>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label className="form-label">White Team Score</label>
                            <input
                                type="number"
                                className="form-input"
                                value={whiteTeamScore}
                                onChange={(e) => setWhiteTeamScore(e.target.value)}
                                min="0"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Black Team Score</label>
                            <input
                                type="number"
                                className="form-input"
                                value={blackTeamScore}
                                onChange={(e) => setBlackTeamScore(e.target.value)}
                                min="0"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Match Date & Time</label>
                        <input
                            type="datetime-local"
                            className="form-input"
                            value={matchDate}
                            onChange={(e) => setMatchDate(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Add Players */}
                <div className="card">
                    <h2 style={{ marginBottom: '1rem', color: '#333' }}>Add Players to Teams</h2>

                    {availablePlayers.length > 0 ? (
                        <div className="grid grid-3">
                            <div className="form-group">
                                <label className="form-label">Select Player</label>
                                <select
                                    className="form-select"
                                    value={selectedPlayerId}
                                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                                >
                                    <option value="">Choose a player...</option>
                                    {availablePlayers.map(player => (
                                        <option key={player.id} value={player.id}>
                                            {player.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Team</label>
                                <select
                                    className="form-select"
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                >
                                    <option value="white">White Team</option>
                                    <option value="black">Black Team</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={addPlayerToTeam}
                                    disabled={!selectedPlayerId}
                                    style={{ width: '100%' }}
                                >
                                    Add to Team
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>
                            All players have been assigned to teams
                        </p>
                    )}
                </div>

                {/* Teams Display */}
                <div className="grid grid-2">
                    {/* White Team */}
                    <div className="card team-white">
                        <h3 style={{ marginBottom: '1rem', color: '#333' }}>
                            White Team ({whiteTeamPlayers.length} players)
                        </h3>

                        {whiteTeamPlayers.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>No players added yet</p>
                        ) : (
                            whiteTeamPlayers.map(player => (
                                <div key={player.id} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '10px', border: '2px solid #ddd' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: '#333' }}>{player.name}</h4>
                                        <button
                                            type="button"
                                            onClick={() => removePlayerFromTeam(player.id, 'white')}
                                            className="btn btn-danger"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-2" style={{ gap: '0.5rem' }}>
                                        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                            <label style={{ fontSize: '0.9rem', color: '#555' }}>Gamelles</label>
                                            <input
                                                type="number"
                                                value={player.gamellesScored}
                                                onChange={(e) => updatePlayerStat(player.id, 'white', 'gamellesScored', e.target.value)}
                                                min="0"
                                                style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                            <label style={{ fontSize: '0.9rem', color: '#555' }}>Own Goals</label>
                                            <input
                                                type="number"
                                                value={player.ownGoalScored}
                                                onChange={(e) => updatePlayerStat(player.id, 'white', 'ownGoalScored', e.target.value)}
                                                min="0"
                                                style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
                                            <input
                                                type="checkbox"
                                                checked={player.isPlayerOfTheMatch}
                                                onChange={(e) => updatePlayerStat(player.id, 'white', 'isPlayerOfTheMatch', e.target.checked)}
                                            />
                                            Player of the Match
                                        </label>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Black Team */}
                    <div className="card team-black">
                        <h3 style={{ marginBottom: '1rem', color: 'white' }}>
                            Black Team ({blackTeamPlayers.length} players)
                        </h3>

                        {blackTeamPlayers.length === 0 ? (
                            <p style={{ color: '#ccc', fontStyle: 'italic' }}>No players added yet</p>
                        ) : (
                            blackTeamPlayers.map(player => (
                                <div key={player.id} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#495057', borderRadius: '10px', border: '2px solid #6c757d' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: 'white' }}>{player.name}</h4>
                                        <button
                                            type="button"
                                            onClick={() => removePlayerFromTeam(player.id, 'black')}
                                            className="btn btn-danger"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-2" style={{ gap: '0.5rem' }}>
                                        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                            <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Gamelles</label>
                                            <input
                                                type="number"
                                                value={player.gamellesScored}
                                                onChange={(e) => updatePlayerStat(player.id, 'black', 'gamellesScored', e.target.value)}
                                                min="0"
                                                style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                            <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Own Goals</label>
                                            <input
                                                type="number"
                                                value={player.ownGoalScored}
                                                onChange={(e) => updatePlayerStat(player.id, 'black', 'ownGoalScored', e.target.value)}
                                                min="0"
                                                style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                                            <input
                                                type="checkbox"
                                                checked={player.isPlayerOfTheMatch}
                                                onChange={(e) => updatePlayerStat(player.id, 'black', 'isPlayerOfTheMatch', e.target.checked)}
                                            />
                                            Player of the Match
                                        </label>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting || whiteTeamPlayers.length === 0 || blackTeamPlayers.length === 0}
                        style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                    >
                        {submitting ? 'Creating Match...' : 'Create Match'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMatchPage;