const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const redis = require('redis');
const app = express();
const server = http.createServer(app);
const PORT = 4000;

const { sequelize, ChatRoom } = require('./modules/models.js')

async function initDb() {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB !!!")
    } catch (error) {
        console.error('Unable to connect to the database:', error)
    }
}

const API_URL = 'http://backend:8000/api'
const rooms = {};

app.use(cors());
app.get('/', (req, res) => {
    res.send('Chat server and WebSocket bridge is running!');
});

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// Setup Redis Client for subscribing to backend events
const redisClient = redis.createClient({
    url: 'redis://redis:6379/0'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

async function initRedis() {
    await redisClient.connect();
    
    // Use pSubscribe for dynamic user topics
    await redisClient.pSubscribe('user_market_update:*', (message, channel) => {
        try {
            const data = JSON.parse(message);
            const userId = channel.split(':')[1];
            // Broadcast only to that specific user's room
            io.of('/black-market').to(`user_${userId}`).emit('market_update', data);
        } catch (e) {
            console.error('Error handling user_market_update message:', e);
        }
    });

    await redisClient.subscribe('prices_updated', (message) => {
        try {
            const data = JSON.parse(message);
            // Broadcast to everyone in black-market
            io.of('/black-market').emit('prices_updated', data);
        } catch (e) {
            console.error('Error handling prices_updated message:', e);
        }
    });
    
    console.log("Connected to Redis Pub/Sub!");
}

const authConnection = async (token, roomId) => {
    return axios.post(`${API_URL}/chat/authenticate_connection`, {
        room_id: roomId,
        token: token
    })
    .then(response => {
        return response.data.username
    })
    .catch(error => {
        console.error("Authorization failed:", error?.response?.data || error.message)
        return null
    })
}

// ---- CHAT NAMESPACES ----
const initChatRooms = async () => {
    try {
        const res = await ChatRoom.findAll();

        res.forEach(room => {
            rooms[room.id] = io.of(`/chat-${room.id}`)
            setupChatRoom(rooms[room.id])
        })
    } catch (err) {
        console.error('Error fetching chat rooms:', err);
    }
};

const setupChatRoom = (room) => {
    room.on('connection', async (socket) => {
        console.log('a user connected to a chat room');

        const roomId = socket.handshake.query.room_id;
        const token = socket.handshake.query.token;
        const username = await authConnection(token, roomId)

        if (!username) {
            console.log('user not authorized to join chat room');
            socket.disconnect();
            return;
        }

        socket.on('send_message', (msg) => {
            room.emit('chat_message', {
                'username': username,
                'message': msg,
            });
        });

        socket.on('disconnect', () => {
            console.log('user disconnected from chat room');
        });
    });
};

// ---- BLACK MARKET NAMESPACE ----
const bmNamespace = io.of('/black-market');
bmNamespace.on('connection', async (socket) => {
    console.log('a user connected to the black market');
    
    // We expect the frontend to pass token and user_id in the query
    const token = socket.handshake.query.token;
    const userId = socket.handshake.query.user_id;

    // Optional: Authenticate the connection here if needed.
    // For now, we just join them to their specific user room
    if (userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their market channel`);
    } else {
        console.log('No user_id provided for black market connection');
        socket.disconnect();
        return;
    }

    socket.on('disconnect', () => {
        console.log('user disconnected from black market');
    });
});

// This is the default namespace '/'
io.on('connection', (socket) => {
    console.log('a user connected to the default namespace');
    socket.on('disconnect', () => {
        console.log('user disconnected from the default namespace');
    });
});

server.listen(PORT, async () => {
    await initDb()
    await initChatRooms()
    await initRedis()

    console.log('Server is running!');
});