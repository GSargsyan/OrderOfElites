const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const app = express();
const server = http.createServer(app);
const PORT = 4000;

const { sequelize, ChatRoom } = require('./modules/models.js')

async function initDb() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        console.log("Connected to DB !!!")
    } catch (error) {
        console.error('Unable to connect to the database:', error)
    }
}

const API_URL = 'http://backend:8000/api'
const rooms = {};

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
    return axios.post(`${API_URL}/chat/authenticate_connection`, {
        room_id: roomId,
        token: token
    })
    .then(response => {
        return response.data.username
    })
    .catch(error => {
        console.error("Authorization failed:", error.response.data)
        return null
    })
}

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

        // BEGIN authorize user
        const roomId = socket.handshake.query.room_id;
        const token = socket.handshake.query.token;
        const username = await authConnection(token, roomId)

        if (!username) {
            console.log('user not authorized to join chat room');
            socket.disconnect();
            return;
        }
        // END authorize user

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

    console.log('Chat server is running!');
});