const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const redis = require('redis');

const { sequelize, ChatRoom } = require('./modules/models.js');
const { setupChatRoom } = require('./modules/chatHandler.js');
const { setupNotifications } = require('./modules/dmHandler.js');

const app = express();
const server = http.createServer(app);
const PORT = 4000;

// ── Database ──────────────────────────────────────────────
async function initDb() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB !!!');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

// ── Express ───────────────────────────────────────────────
app.use(cors());
app.get('/', (req, res) => {
    res.send('Chat server and WebSocket bridge is running!');
});

// ── Socket.IO ─────────────────────────────────────────────
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// ── Redis Clients ─────────────────────────────────────────
// Subscriber client for receiving published messages
const redisSub = redis.createClient({ url: 'redis://redis:6379/0' });
redisSub.on('error', (err) => console.log('Redis Sub Error', err));

// ── Chat Room Namespaces ──────────────────────────────────
const rooms = {};

async function initChatRooms() {
    try {
        const chatRooms = await ChatRoom.findAll();

        chatRooms.forEach(room => {
            rooms[room.id] = io.of(`/chat-${room.id}`);
            setupChatRoom(rooms[room.id]);
            console.log(`Chat room namespace /chat-${room.id} (${room.name}) initialized`);
        });
    } catch (err) {
        console.error('Error fetching chat rooms:', err);
    }
}

// ── Notifications Namespace (for DMs) ─────────────────────
let notifNamespace;

// ── Black Market Namespace ────────────────────────────────
const bmNamespace = io.of('/black-market');
bmNamespace.on('connection', async (socket) => {
    const token = socket.handshake.query.token;
    const userId = socket.handshake.query.user_id;

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

// ── Redis Pub/Sub ─────────────────────────────────────────
async function initRedis() {
    await redisSub.connect();

    // ── Black Market subscriptions (existing) ──
    await redisSub.pSubscribe('user_market_update:*', (message, channel) => {
        try {
            const data = JSON.parse(message);
            const userId = channel.split(':')[1];
            io.of('/black-market').to(`user_${userId}`).emit('market_update', data);
        } catch (e) {
            console.error('Error handling user_market_update message:', e);
        }
    });

    await redisSub.subscribe('prices_updated', (message) => {
        try {
            const data = JSON.parse(message);
            io.of('/black-market').emit('prices_updated', data);
        } catch (e) {
            console.error('Error handling prices_updated message:', e);
        }
    });

    // ── City Chat subscriptions ──
    // Subscribe to city_message:* — broadcast to the matching chat room namespace
    await redisSub.pSubscribe('city_message:*', (message, channel) => {
        try {
            const data = JSON.parse(message);
            const roomId = channel.split(':')[1];

            // Broadcast to all connected clients in this chat room namespace
            if (rooms[roomId]) {
                rooms[roomId].emit('chat_message', data);
            }
        } catch (e) {
            console.error('Error handling city_message:', e);
        }
    });

    // ── DM subscriptions ──
    // Subscribe to dm_message:* — push to the specific user's notification room
    await redisSub.pSubscribe('dm_message:*', (message, channel) => {
        try {
            const data = JSON.parse(message);
            const userId = channel.split(':')[1];

            // Push to the user's personal notification room
            if (notifNamespace) {
                notifNamespace.to(`user_${userId}`).emit('new_dm', data);
            }
        } catch (e) {
            console.error('Error handling dm_message:', e);
        }
    });

    console.log('Connected to Redis Pub/Sub!');
}

// ── Default Namespace ─────────────────────────────────────
io.on('connection', (socket) => {
    console.log('a user connected to the default namespace');
    socket.on('disconnect', () => {
        console.log('user disconnected from the default namespace');
    });
});

// ── Start Server ──────────────────────────────────────────
server.listen(PORT, async () => {
    await initDb();
    await initChatRooms();

    // Initialize notifications namespace (for DMs)
    notifNamespace = setupNotifications(io);

    await initRedis();

    console.log('Server is running!');
});