const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add route to handle room redirects
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store active rooms
const rooms = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Handle user joining a room
    socket.on('joinRoom', ({ username, roomId }) => {
        // Create room if it doesn't exist
        if (!rooms[roomId]) {
            rooms[roomId] = {
                users: {},
                votesRevealed: false
            };
        }
        
        // Join the socket.io room
        socket.join(roomId);
        
        // Store user in the room
        rooms[roomId].users[socket.id] = {
            username,
            vote: null
        };
        
        // Save roomId to socket for reference
        socket.roomId = roomId;
        socket.username = username;
        
        // Notify all clients in the room
        io.to(roomId).emit('roomUpdate', {
            users: rooms[roomId].users,
            votesRevealed: rooms[roomId].votesRevealed
        });
        
        console.log(`${username} joined room ${roomId}`);
    });
    
    // Handle voting
    socket.on('vote', (vote) => {
        const roomId = socket.roomId;
        
        if (roomId && rooms[roomId] && rooms[roomId].users[socket.id]) {
            // Update user's vote
            rooms[roomId].users[socket.id].vote = vote;
            
            // Notify all clients in the room
            io.to(roomId).emit('roomUpdate', {
                users: rooms[roomId].users,
                votesRevealed: rooms[roomId].votesRevealed
            });
            
            console.log(`${socket.username} voted: ${vote} in room ${roomId}`);
        }
    });
    
    // Handle revealing votes
    socket.on('revealVotes', () => {
        const roomId = socket.roomId;
        
        if (roomId && rooms[roomId]) {
            rooms[roomId].votesRevealed = true;
            
            // Notify all clients in the room
            io.to(roomId).emit('roomUpdate', {
                users: rooms[roomId].users,
                votesRevealed: true
            });
            
            console.log(`Votes revealed in room ${roomId}`);
        }
    });
    
    // Handle resetting votes
    socket.on('resetVotes', () => {
        const roomId = socket.roomId;
        
        if (roomId && rooms[roomId]) {
            // Reset all votes in the room
            for (const userId in rooms[roomId].users) {
                rooms[roomId].users[userId].vote = null;
            }
            
            rooms[roomId].votesRevealed = false;
            
            // Notify all clients in the room
            io.to(roomId).emit('roomUpdate', {
                users: rooms[roomId].users,
                votesRevealed: false
            });
            
            console.log(`Votes reset in room ${roomId}`);
        }
    });
    
    // Handle disconnections
    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        
        if (roomId && rooms[roomId] && rooms[roomId].users[socket.id]) {
            // Remove user from the room
            console.log(`${socket.username} left room ${roomId}`);
            delete rooms[roomId].users[socket.id];
            
            // Delete room if empty
            if (Object.keys(rooms[roomId].users).length === 0) {
                console.log(`Room ${roomId} is empty, deleting...`);
                delete rooms[roomId];
            } else {
                // Notify remaining clients
                io.to(roomId).emit('roomUpdate', {
                    users: rooms[roomId].users,
                    votesRevealed: rooms[roomId].votesRevealed
                });
            }
        }
        
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});

