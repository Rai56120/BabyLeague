import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { matchesAPI } from '../api';

const MatchDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMatch();
    }, [id]);

    const fetchMatch = async () => {
        try {
            setLoading(true);
            const response = await matchesAPI.getById(id);
            setMatch(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch match details');
            console.error('Error fetching match:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMatch = async () => {
        if (window.confirm('Are you sure you want to delete this match? This will also update all player statistics.')) {
            try {
                await matchesAPI.delete(id);
                navigate('/');
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to delete match');
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getWinningTeam = () => {
        if (match.whiteTeamScore > match.blackTeamScore) return 'white';
        if (match.blackTeamScore > match.whiteTeamScore) return 'black';
        return 'draw';
    };

    const getTeamPlayers = (isWhiteTeam) => {
        return match.players.filter(mp => mp.team === isWhiteTeam);
    };

    const getPlayerOfTheMatch = () => {
        return match.players.find(mp => mp.isPlayerOfTheMatch);
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">Loading match details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="error">{error}</div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link to="/" className="btn btn-primary">
                        Back to Matches
                    </Link>
                </div>
            </div>
        );
    }

    if (!match) {
        return (
            <div className="page-container">
                <div className="error">Match not found</div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link to="/" className="btn btn-primary">
                        Back to Matches
                    </Link>
                </div>
            </div>
        );
    }

    const winningTeam = getWinningTeam();
    const whiteTeamPlayers = getTeamPlayers(true);
    const blackTeamPlayers = getTeamPlayers(false);
    const playerOfTheMatch = getPlayerOfTheMatch();
    const totalGamelles = match.players.reduce((sum, mp) => sum + mp.gamellesScored, 0);
    const totalOwnGoals = match.players.reduce((sum, mp) => sum + mp.ownGoalScored, 0);

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Match Details</h1>
                <div>
                    <Link to="/" className="btn btn-secondary" style={{ marginRight: '1rem' }}>
                        Back to Matches
                    </Link>
                    <button onClick={handleDeleteMatch} className="btn btn-danger">
                        Delete Match
                    </button>
                </div>
            </div>

            {error && <div className="error">{error}</div>}

            {/* Match Summary */}
            <div className="card">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1rem' }}>
                        {formatDate(match.date)}
                    </p>

                    <div className="match-score">
                        <div className="team-score">
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>WHITE TEAM</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{match.whiteTeamScore}</div>
                            </div>

                            <div className="score-separator">-</div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>BLACK TEAM</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{match.blackTeamScore}</div>
                            </div>
                        </div>
                    </div>

                    {winningTeam !== 'draw' && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: winningTeam === 'white' ? '#f8f9fa' : '#343a40',
                            color: winningTeam === 'white' ? '#333' : 'white',
                            borderRadius: '10px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold'
                        }}>
                            🏆 {winningTeam.toUpperCase()} TEAM WINS!
                        </div>
                    )}

                    {winningTeam === 'draw' && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold'
                        }}>
                            🤝 IT'S A DRAW!
                        </div>
                    )}
                </div>
            </div>

            {/* Match Statistics */}
            <div className="card">
                <h2 style={{ marginBottom: '1rem', color: '#333' }}>Match Statistics</h2>
                <div className="grid grid-3">
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{totalGamelles}</div>
                        <div style={{ color: '#666' }}>Total Gamelles</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{totalOwnGoals}</div>
                        <div style={{ color: '#666' }}>Total Own Goals</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{match.players.length}</div>
                        <div style={{ color: '#666' }}>Total Players</div>
                    </div>
                </div>

                {playerOfTheMatch && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '10px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌟 Player of the Match</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                            <Link
                                to={`/player/${playerOfTheMatch.playerId}`}
                                style={{ textDecoration: 'none', color: '#333' }}
                            >
                                {playerOfTheMatch.player.name}
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Teams */}
            <div className="grid grid-2">
                {/* White Team */}
                <div className="card team-white">
                    <h3 style={{ marginBottom: '1rem', color: '#333', textAlign: 'center' }}>
                        White Team ({whiteTeamPlayers.length} players)
                    </h3>

                    {whiteTeamPlayers.map(matchPlayer => (
                        <div key={matchPlayer.id} style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            border: '2px solid #ddd'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, color: '#333' }}>
                                    <Link
                                        to={`/player/${matchPlayer.playerId}`}
                                        style={{ textDecoration: 'none', color: '#333' }}
                                    >
                                        {matchPlayer.player.name}
                                    </Link>
                                    {matchPlayer.isPlayerOfTheMatch && <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>⭐</span>}
                                </h4>
                            </div>

                            <div className="grid grid-2" style={{ gap: '0.5rem' }}>
                                <div className="stat-item" style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                    <span className="stat-label">Goals Scored:</span>
                                    <span className="stat-value">{match.whiteTeamScore}</span>
                                </div>

                                <div className="stat-item" style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                    <span className="stat-label">Goals Conceded:</span>
                                    <span className="stat-value">{match.blackTeamScore}</span>
                                </div>

                                <div className="stat-item" style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                    <span className="stat-label">Gamelles:</span>
                                    <span className="stat-value">{matchPlayer.gamellesScored}</span>
                                </div>

                                <div className="stat-item" style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                    <span className="stat-label">Own Goals:</span>
                                    <span className="stat-value">{matchPlayer.ownGoalScored}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Black Team */}
                <div className="card team-black">
                    <h3 style={{ marginBottom: '1rem', color: 'white', textAlign: 'center' }}>
                        Black Team ({blackTeamPlayers.length} players)
                    </h3>

                    {blackTeamPlayers.map(matchPlayer => (
                        <div key={matchPlayer.id} style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            backgroundColor: '#495057',
                            borderRadius: '10px',
                            border: '2px solid #6c757d'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, color: 'white' }}>
                                    <Link
                                        to={`/player/${matchPlayer.playerId}`}
                                        style={{ textDecoration: 'none', color: 'white' }}
                                    >
                                        {matchPlayer.player.name}
                                    </Link>
                                    {matchPlayer.isPlayerOfTheMatch && <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>⭐</span>}
                                </h4>
                            </div>

                            <div className="grid grid-2" style={{ gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #6c757d' }}>
                                    <span style={{ color: '#ccc' }}>Goals Scored:</span>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{match.blackTeamScore}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #6c757d' }}>
                                    <span style={{ color: '#ccc' }}>Goals Conceded:</span>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{match.whiteTeamScore}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #6c757d' }}>
                                    <span style={{ color: '#ccc' }}>Gamelles:</span>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{matchPlayer.gamellesScored}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #6c757d' }}>
                                    <span style={{ color: '#ccc' }}>Own Goals:</span>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{matchPlayer.ownGoalScored}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MatchDetailsPage;