const express = require('express');
const path = require('path');
const http = require('http');
const PORT = process.env.PORT || 3000;
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

// start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle a socket connection request from web client
const connections = [null, null];

io.on('connection', socket => {
    // Find an available player number
    let playerIndex = -1
    for (const i in connections) {
        if (connections[i] === null) {
            playerIndex = i;
            break;
        }
    }

    // Tell the connecting client what player number they are
    socket.emit('player-number', playerIndex);
    
    console.log(`Player ${playerIndex} has connected`);
    
    // Ignore player 3
    if (playerIndex === -1) return;

    connections[playerIndex] = false;

    // Tell everyone what player number just connected
    socket.broadcast.emit('player-connection', playerIndex);

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`);
        connections[playerIndex] = null;
        socket.broadcast.emit('player-connection', playerIndex);
    });

    // On Ready
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex);
        connections[playerIndex] = true;
    });

    // Check player connections
    socket.on('check-players', () => {
        const players = [];
        for (const i in connections) {
            connections[i] === null ? players.push({connected: false, ready: false }) : players.push({connected: true, ready: connections[i]});
        }

        socket.emit('check-players', players);
    });

    // On fire received
    socket.on('fire', id => {
        console.log('shot fired from ' + playerIndex + ' ' + id);
        socket.broadcast.emit('fire', id);
    });

    // On fire reply
    socket.on('fire-reply', square => {
        console.log(square);

        // Forwared the reply to the other player
        socket.broadcast.emit('fire-reply', square);
    })

    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit('timeout');
        socket.disconnect();
    }, 600000); // 10 minute time limit
});