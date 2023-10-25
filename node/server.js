const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const PORT = 4000;
const chatRooms = {};

const pool = new Pool({
    user: 'ooe',
    host: 'ooe_psql',
    database: 'ooe_db',
    password: 'ooe_pwd',
    port: 5432,
});

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

// Fetch chat groups and initialize chat rooms
const initializeChatGroups = async () => {
    try {
        const res = await pool.query('SELECT * FROM ooe_chat_groups');
        for (const group of res.rows) {
            chatRooms[group.id] = io.of(`/chat-${group.id}`);
            setupChatRoom(chatRooms[group.id]);
        }
    } catch (err) {
        console.error('Error fetching chat groups:', err);
    }
};

// Setup chat room events
const setupChatRoom = (chatRoom) => {
    chatRoom.on('connection', (socket) => {
        console.log('a user connected to a chat room');

        socket.on('join', async (userId, groupId) => {
            // Add user to user_chat_groups table
            try {
                await pool.query('INSERT INTO ooe_chat_connections (user_id, group_id) VALUES ($1, $2)', [userId, groupId]);
            } catch (err) {
                console.error('Error adding user to chat group:', err);
            }
        });

        socket.on('send_message', (msg) => {
            chatRoom.emit('chat_message', msg);
        });

        socket.on('disconnect', () => {
            console.log('user disconnected from chat room');
        });
    });
};

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await initializeChatGroups();
});