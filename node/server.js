const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const PORT = 4000;

app.get('/', (req, res) => {
    res.send('Chat server is running!');
});
app.use(cors())

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    console.log('a user connected');

    // When the server receives a 'chat message' event
    socket.on('send_message', (msg) => {
        // Send the message to all connected clients
        io.emit('chat_message', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
