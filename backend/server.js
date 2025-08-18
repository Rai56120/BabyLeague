import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/index.js';

dotenv.config();                                                // Load variales from .env to process.env
const app = express();                                          // Create a Express app instance
const prisma = new PrismaClient();                              // Create a prisma client to connect to the DB
const PORT = process.env.BACKEND_PORT || 5000;

// --------------------------------------------------
// ------------------- Middleware -------------------
// --------------------------------------------------
app.use(cors({      // Cors allows the communication between frontend and backend
    origin: process.env.FRONTEND_URL + process.env.FRONTEND_PORT || 'http://localhost:5173/',
    credentials: true
}));

app.use(express.json());                                        // Parse incoming JSON bodies into req.body

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});


// ---------------------------------------------------
// ------------------ Player routes ------------------
// ---------------------------------------------------

// Get all players
app.get('/api/players', asyncHandler(async (req, res) => {
    const players = await prisma.player.findMany({
        orderBy: { name: 'asc' },
        include: {
            matches: {
                include: {
                    match: true
                }
            }
        }
    });
    res.json(players);
}));

// Get a player by name
app.get('/api/players/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const players = await prisma.player.findUnique({
        where: { id: parseInt(id) },
        include: {
            matches: {
                include: {
                    match: true
                }
            }
        }
    });

    if (!players) {
        return res.status(404).json({ error: 'Player not found' });
    }

    res.json(players);
}));

// Create a new player
app.post('/api/players', asyncHandler(async (req, res) => {
    const { name } = req.body;
    // We verify that there is a name 
    if (!name) {
        return res.status(400).json({ error: 'Player not found' });
    }
    const player = await prisma.player.create({
        data: { name }
    })

    res.status(201).json(player);
}));

// Update an existing player fields
app.put('/api/players/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    try {
        const player = await prisma.player.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        res.json(player);
    } catch (error) {
        if (error.code('P2025')) {
            return res.status(404).json({ error: 'Player not found' });
        }

        throw error;
    }
}));

// Delete player
app.delete('/api/players/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const player = await prisma.player.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.status(204).json(player);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Player not found' });
        }
        throw error;
    }
}));


// --------------------------------------------------
// ------------------ Match routes ------------------
// --------------------------------------------------

// Get all matches
app.get('/api/matches', asyncHandler(async (req, res) => {
    const matches = await prisma.match.findMany({
        orderBy: { date: 'asc' },
        include: {
            players: {
                include: {
                    player: true
                }
            }
        }
    });

    res.json(matches);
}));

// Get match by id
app.get('/api/matches/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
        where: {
            id: parseInt(id),
        },
        include: {
            players: {
                include: {
                    player: true
                }
            }
        }
    });

    if (!match) {
        return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
}));

// Create new match with players and update players stats
app.post('/api/matches', asyncHandler(async (req, res) => {
    console.log(`============== Match creation ==============`);
    
    const { whiteTeamScore, blackTeamScore, players, date } = req.body;

    const isInvalidScore = (score) => score === undefined || score === null || typeof score !== 'number';
    const isInvalidPlayers = !players || !Array.isArray(players);

    if (isInvalidScore(whiteTeamScore) || isInvalidScore(blackTeamScore) || isInvalidPlayers) {
        return res.status(400).json({ error: 'Invalid match data' });
    }

    const result = await prisma.$transaction(async (tx) => {
        // Create the match
        const match = await tx.match.create({
            data: {
                whiteTeamScore,
                blackTeamScore,
                date: date ? new Date(date) : new Date()
            }
        });

        //Create MatchPlayer entries
        const matchPlayerData = players.map(player => ({
            matchId: match.id,
            playerId: player.playerId,
            team: player.team,
            gamellesScored: player.gamellesScored || 0,
            ownGoalsScored: player.ownGoalsScored || 0,
            isPlayerOfTheMatch: player.isPlayerOfTheMatch || false
        }));

        await tx.matchPlayer.createMany({
            data: matchPlayerData
        });

        // Update player aggregate stats
        for (const player of players) {
            const isWhiteTeam = player.team;
            const isWinner = (isWhiteTeam && whiteTeamScore > blackTeamScore) ||
                (!isWhiteTeam && blackTeamScore > whiteTeamScore);
            
            const updateData = {
                gamellesScored: { increment: player.gamellesScored || 0 },
                ownGoalsScored: { increment: player.ownGoalsScored || 0 }
            };

            // Update goals scored/concerned
            if (isWhiteTeam) {
                updateData.goalsScoredWhite = { increment: whiteTeamScore };
                updateData.goalsConcededWhite = { increment: blackTeamScore };
            } else {
                updateData.goalsScoredBlack = { increment: blackTeamScore };
                updateData.goalsConcededBlack = { increment: whiteTeamScore };
            }

            // Update player of the match count


            await tx.player.update({
                where: { id: player.playerId },
                data: updateData
            });
        }

        return match;
    });

    // Fetch the complete match with players
    const completeMatch = await prisma.match.findUnique({
        where: { id: result.id },
        include: {
            players: {
                include: {
                    player: true
                }
            }
        }
    });

    res.status(201).json(completeMatch);
}));

// Update match
app.put('/api/matches/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { whiteTeamScore, blackTeamScore, date } = req.body;

    try {
        const match = await prisma.match.update({
            where: { id: parseInt(id) },
            data: {
                whiteTeamScore,
                blackTeamScore,
                date: date ? new Date(date) : undefined
        },
            include: {
                players: {
                    include: {
                        player: true
                    }
                }
            }
        });

        res.json(match);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Match not found' });
        }

        throw error;
    }
}));

// Delete match and update player stats
app.delete('/api/matches/:id', asyncHandler(async (req, res) => {
    console.log(`============== match delete function ==============`)
    const { id } = req.params;
    const matchId = parseInt(id);

    if (isNaN(matchId)) {
        return res.status(400).json({ error: 'Invalid match ID' });
    }

    try {
        // Reverse the stats for each player
        await prisma.$transaction(async (tx) => {
            // Get basic match info
            const match = await tx.match.findUnique({
                where: { id: matchId }
            });

            if (!match) {
                throw new Error('Match not found');
            }

            console.log('Match found:', { id: match.id, whiteScore: match.whiteTeamScore, blackScore: match.blackTeamScore });

            // Get players separately to avoid the function issue
            const matchPlayers = await tx.matchPlayer.findMany({
                where: { matchId: matchId },
                include: {
                    player: true
                }
            });

            console.log(`Found ${matchPlayers.length} players for this match`);

            // Reverse the stats for each player
            for (const matchPlayer of matchPlayers) {
                const isWhiteTeam = matchPlayer.team;
                
                const updateData = {
                    gamellesScored: { decrement: matchPlayer.gamellesScored || 0 },
                    ownGoalsScored: { decrement: matchPlayer.ownGoalsScored || 0 }
                };
                
                // Reverse goals scored/conceded based on team
                if (isWhiteTeam) {
                    updateData.goalsScoredWhite = { decrement: match.whiteTeamScore || 0 };
                    updateData.goalsConcededWhite = { decrement: match.blackTeamScore || 0 };
                } else {
                    updateData.goalsScoredBlack = { decrement: match.blackTeamScore || 0 };
                    updateData.goalsConcededBlack = { decrement: match.whiteTeamScore || 0 };
                }
                
                // Reverse player of the match count
                if (matchPlayer.isPlayerOfTheMatch) {
                    updateData.playerOfTheMatch = { decrement: 1 };
                }
                
                console.log(`Updating player ${matchPlayer.playerId} with:`, updateData);
                
                await tx.player.update({
                    where: { id: matchPlayer.playerId },
                    data: updateData
                });
            }

            // Delete the match (MatchPlayer entries are deleted automatically due to CASCADE)
            await tx.match.delete({
                where: { id: matchId }
            });
            
            console.log(`Match ${matchId} and ${matchPlayers.length} related records deleted successfully`);
        });

        res.status(204).send();

    } catch (error) {
        console.error('Error deleting match:', error);

        if (error.message === 'Match not found' || error.message === 'Match not found in transaction' || error.code === 'P2025') {
            return res.status(404).json({ error: 'Match not found' });
        }

        console.error('Full error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        throw error;
    }
}));

// ---------------------------------------------------------------------
// -- Match player routes (for individual match-player relationships) --
// ---------------------------------------------------------------------

// Update match player stats
app.put('/api/match-players/:matchId/:playerId', asyncHandler(async (req, res) => {
    const { matchId, playerId } = req.params;
    const updateData = req.body;

    try {
        const matchPlayer = await prisma.matchPlayer.update({
            where: {
                matchId_playerId: {
                    matchId: parseInt(matchId),
                    playerId: parseInt(playerId)
                }
            },
            data: updateData,
            include: {
                player: true,
                match: true
            }
        });

        res.json(matchPlayer);
    } catch (error) {
        if (error.code === ('P2025')) {
            return res.status(404).json({ error: 'Match player relationship not found' });
        }

        throw error;
    }
}));

// Delete match player (remove player from match)
app.delete('/api/match-players/:matchId/:playerId', asyncHandler(async (req, res) => {
    const { matchId, playerId } = req.params;

    try {
        await prisma.matchPlayer.delete({
            where: {
                matchId_playerId: {
                    matchId: parseInt(matchId),
                    playerId: parseInt(playerId)
                }
            }
        });

        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Match player relationship not found' });
        }

        throw error;
    }
}));

// ---------------------------------------------------
// ---------------- Statistics routes ----------------
// ---------------------------------------------------

// Get player leaderboard
app.get('/api/stats/leaderboard', asyncHandler(async (req, res) => {
    const players = await prisma.player.findMany({
        orderBy: [
            { playerOfTheMatch: 'desc' },
            { gamellesScored: 'desc' }
        ]
    });

    res.json(players);
}));

// Get match statistics
app.get('/api/stats/matches', asyncHandler(async (req, res) => {
    const totalMatches = await prisma.match.count();
    const recentMatches = await prisma.match.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: {
            players: {
                include: {
                    player: true
                }
            }
        }
    });

    res.json({
        totalMatches,
        recentMatches
    });
}));

// ---------------------------------------------------
// ------------ Error handling middleware ------------
// ---------------------------------------------------
app.use((error, req, res, next) => {
    console.error('Error', error);

    // Log additional details in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', error.stack);
    }

    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'route not found' });
});

// Start server
app.listen(process.env.BACKEND_PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL + process.env.FRONTEND_PORT || 'http://localhost:3000'}`);

    if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    }
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🛑 Shutting down server...');

    try {
        await prisma.$disconnect();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }

    process.exit();
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle unhandled promise rejecctions
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown();
    }
});