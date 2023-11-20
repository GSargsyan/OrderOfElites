const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const PORT = 4000;
const chatRooms = {};

// TODO: Create special user for node server with READONLY access
const pool = new Pool({
    user: 'ooe',
    host: 'ooe_psql',
    database: 'ooe_db',
    password: 'ooe_pwd',
    port: 5432,
});

const API_URL = 'http://backend:8000/api'

app.use(cors());
app.get('/', (req, res) => {
    res.send('Chat server is running!');
});

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const authConnection = async (token, roomId) => {
    const response = await axios.post(`${API_URL}/chat/authenticate_connection`, {
        room_id: roomId,
        token: token
    });

    return response.status === 200
}

const initializeChatRooms = async () => {
    try {
        const res = await pool.query('SELECT * FROM ooe_chat_rooms');

        for (const room of res.rows) {
            chatRooms[room.id] = io.of(`/chat-${room.id}`);
            setupChatRoom(chatRooms[room.id]);
        }
    } catch (err) {
        console.error('Error fetching chat rooms:', err);
    }
};

const setupChatRoom = (chatRoom) => {
    chatRoom.on('connection', async (socket) => {
        console.log('a user connected to a chat room');

        // BEGIN authorize user
        const roomId = socket.handshake.query.room_id;
        const token = socket.handshake.query.token;

        if (!roomId || !token || !authConnection(token, roomId)) {
            console.log('user not authorized to join chat room');
            socket.disconnect();
            return;
        }
        // END authorize user

        socket.on('send_message', (msg) => {
            chatRoom.emit('chat_message', msg);
        });

        socket.on('disconnect', () => {
            console.log('user disconnected from chat room');
        });
    });
};

// This is the default namespace '/'
io.on('connection', (socket) => {
    console.log('a user connected to the default namespace');
    socket.on('disconnect', () => {
        console.log('user disconnected from the default namespace');
    });
});

server.listen(PORT, async () => {
    console.log('Chat server is running!');
    await initializeChatRooms();
});