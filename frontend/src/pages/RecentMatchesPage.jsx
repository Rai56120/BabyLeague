import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchesAPI, statsAPI } from '../api';

const RecentMatchesPage = () => {
    const [matches, setMatches] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [matchesResponse, statsResponse] = await Promise.all([
                matchesAPI.getAll(),
                statsAPI.getMatchStats()
            ]);

            // Get only the last 10 matches
            setMatches(matchesResponse.data.slice(0, 10));
            setStats(statsResponse.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch matches and statistics');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getWinningTeam = (whiteScore, blackScore) => {
        if (whiteScore > blackScore) return 'white';
        if (blackScore > whiteScore) return 'black';
        return 'draw';
    };

    const getPlayerOfTheMatch = (match) => {
        const potm = match.players.find(mp => mp.isPlayerOfTheMatch);
        return potm ? potm.player.name : null;
    };

    const getTotalGamelles = (match) => {
        return match.players.reduce((sum, mp) => sum + mp.gamellesScored, 0);
    };

    const getTotalOwnGoals = (match) => {
        return match.players.reduce((sum, mp) => sum + mp.ownGoalScored, 0);
    };

    const getTeamPlayers = (match, isWhiteTeam) => {
        return match.players.filter(mp => mp.team === isWhiteTeam);
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">Loading recent matches...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Recent Matches</h1>

            {error && <div className="error">{error}</div>}

            {/* Quick Stats */}
            {stats && (
                <div className="card">
                    <h2 style={{ marginBottom: '2rem', color: '#333', textAlign: 'center' }}>Quick Statistics</h2>
                    <div className="grid grid-3">
                        <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '15px' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
                                {stats.totalMatches}
                            </div>
                            <div style={{ color: '#666', fontSize: '1.1rem' }}>Total Matches</div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#d4edda', borderRadius: '15px' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
                                {matches.length}
                            </div>
                            <div style={{ color: '#155724', fontSize: '1.1rem' }}>Recent Matches</div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#d1ecf1', borderRadius: '15px' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0c5460', marginBottom: '0.5rem' }}>
                                {matches.length > 0 ? formatDate(matches[0].date) : 'N/A'}
                            </div>
                            <div style={{ color: '#0c5460', fontSize: '1.1rem' }}>Last Match</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Match Button */}
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                <Link to="/add-match" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
                    ➕ Add New Match
                </Link>
            </div>

            {/* Recent Matches List */}
            <div className="card">
                <h2 style={{ marginBottom: '2rem', color: '#333' }}>Last 10 Matches</h2>

                {matches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
                        <h3 style={{ color: '#666', marginBottom: '1rem' }}>No matches found</h3>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>Start by adding your first match!</p>
                        <Link to="/add-match" className="btn btn-primary">
                            Add First Match
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {matches.map(match => {
                            const winningTeam = getWinningTeam(match.whiteTeamScore, match.blackTeamScore);
                            const playerOfTheMatch = getPlayerOfTheMatch(match);
                            const totalGamelles = getTotalGamelles(match);
                            const totalOwnGoals = getTotalOwnGoals(match);
                            const whiteTeamPlayers = getTeamPlayers(match, true);
                            const blackTeamPlayers = getTeamPlayers(match, false);

                            return (
                                <div key={match.id} className="card" style={{ margin: 0, border: '2px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        {/* Match Date and Time */}
                                        <div>
                                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                                {formatDate(match.date)} at {formatTime(match.date)}
                                            </div>
                                        </div>

                                        {/* Quick Action */}
                                        <Link
                                            to={`/match/${match.id}`}
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                        >
                                            View Details
                                        </Link>
                                    </div>

                                    {/* Match Score */}
                                    <div style={{ margin: '1rem 0' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '2rem',
                                            padding: '1rem',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '10px'
                                        }}>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#666', marginBottom: '0.5rem' }}>
                                                    WHITE TEAM
                                                </div>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333' }}>
                                                    {match.whiteTeamScore}
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '2rem', color: '#666' }}>-</div>

                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#666', marginBottom: '0.5rem' }}>
                                                    BLACK TEAM
                                                </div>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333' }}>
                                                    {match.blackTeamScore}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Winner Display */}
                                        {winningTeam !== 'draw' && (
                                            <div style={{
                                                textAlign: 'center',
                                                marginTop: '1rem',
                                                padding: '0.5rem',
                                                backgroundColor: winningTeam === 'white' ? '#f8f9fa' : '#343a40',
                                                color: winningTeam === 'white' ? '#333' : 'white',
                                                borderRadius: '8px',
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold'
                                            }}>
                                                🏆 {winningTeam.toUpperCase()} TEAM WINS!
                                            </div>
                                        )}

                                        {winningTeam === 'draw' && (
                                            <div style={{
                                                textAlign: 'center',
                                                marginTop: '1rem',
                                                padding: '0.5rem',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold'
                                            }}>
                                                🤝 IT'S A DRAW!
                                            </div>
                                        )}
                                    </div>

                                    {/* Players and Quick Stats */}
                                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                                        {/* White Team Players */}
                                        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                                            <h4 style={{ color: '#333', marginBottom: '0.5rem', textAlign: 'center' }}>
                                                White Team ({whiteTeamPlayers.length})
                                            </h4>
                                            {whiteTeamPlayers.map(mp => (
                                                <div key={mp.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.25rem 0',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    <Link
                                                        to={`/player/${mp.playerId}`}
                                                        style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}
                                                    >
                                                        {mp.player.name}
                                                        {mp.isPlayerOfTheMatch && <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>⭐</span>}
                                                    </Link>
                                                    <span style={{ color: '#666', fontSize: '0.8rem' }}>
                                                        G:{mp.gamellesScored} OG:{mp.ownGoalScored}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Black Team Players */}
                                        <div style={{ padding: '1rem', backgroundColor: '#343a40', borderRadius: '10px' }}>
                                            <h4 style={{ color: 'white', marginBottom: '0.5rem', textAlign: 'center' }}>
                                                Black Team ({blackTeamPlayers.length})
                                            </h4>
                                            {blackTeamPlayers.map(mp => (
                                                <div key={mp.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.25rem 0',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    <Link
                                                        to={`/player/${mp.playerId}`}
                                                        style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}
                                                    >
                                                        {mp.player.name}
                                                        {mp.isPlayerOfTheMatch && <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>⭐</span>}
                                                    </Link>
                                                    <span style={{ color: '#ccc', fontSize: '0.8rem' }}>
                                                        G:{mp.gamellesScored} OG:{mp.ownGoalScored}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Match Summary */}
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        backgroundColor: '#e9ecef',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        color: '#495057'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                            <span>
                                                <strong>Total Players:</strong> {match.players.length}
                                            </span>
                                            <span>
                                                <strong>Gamelles:</strong> {totalGamelles}
                                            </span>
                                            <span>
                                                <strong>Own Goals:</strong> {totalOwnGoals}
                                            </span>
                                            {playerOfTheMatch && (
                                                <span>
                                                    <strong>POTM:</strong>
                                                    <Link
                                                        to={`/player/${match.players.find(mp => mp.isPlayerOfTheMatch).playerId}`}
                                                        style={{ textDecoration: 'none', color: '#495057', marginLeft: '0.25rem' }}
                                                    >
                                                        {playerOfTheMatch}
                                                    </Link>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* View All Matches */}
            {stats && stats.totalMatches > 10 && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <p style={{ color: '#666', marginBottom: '1rem' }}>
                        Showing 10 most recent matches out of {stats.totalMatches} total matches.
                    </p>
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            // This could be extended to show more matches or pagination
                            alert('Feature to view all matches could be implemented here');
                        }}
                    >
                        View All Matches
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecentMatchesPage;