import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/index.js';

dotenv.config();                                                // Load variales from .env to process.env
const app = express();                                          // Create a Express app instance
const prisma = new PrismaClient();                              // Create a prisma client to connect to the DB
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL + process.env.FRONTEND_PORT || 'http://localhost:5173/',
    credentials: true
}));                                                            // Cors allows the communication between frontend and backend

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


// Player routes

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
app.get('/api/players/:name', asyncHandler(async (req, res) => {
    const { name } = req.params;
    const players = await prisma.player.findMany({
        orderBy: { id: 'asc' },
        where: { name: name },
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
app.put('/api/players/:id', asyncHandler(async (res, req) => {
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


// Match routes

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


















/*
// GET /api/users -> return all users from the database
app.get('/api/players', async (req, res) => {                   // Declare an async route handler
    try {
        const players = await prisma.player.findMany();
        res.json(players);                                        // Send them back as JSON
    } catch (err) {
        console.error('Error fetching players:', err);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// POST /api/players -> create a new user
app.post('/api/players', async (req, res) => {                    // Another async route handler
    const { name } = req.body;

    // Simple validation
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const newPlayer = await prisma.player.create({
        data: { name }
        });
        res.status(201).json(newPlayer); // 201 = Created
    } catch (err) {
        // Prisma error for duplicate email
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Player already exists' }); // 409 = Conflict
        }
        console.error('Error creating player:', err);
        res.status(500).json({ error: 'Failed to create player' });
    }
});
*/

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
