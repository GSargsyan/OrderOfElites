const axios = require('axios');

const API_URL = 'http://backend:8000/api';

// Rate limiting config
const CITY_RATE_LIMIT_MS = 3000;  // 1 message per 3 seconds in city chat
const DM_RATE_LIMIT_MS = 1000;    // 1 message per 1 second in DMs

// Message length limits
const CITY_MAX_LENGTH = 100;
const DM_MAX_LENGTH = 500;

/**
 * Sanitize message text — strip HTML tags to prevent XSS.
 */
function sanitizeMessage(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Check rate limit for a socket. Returns true if allowed, false if rate limited.
 */
function checkRateLimit(socket, limitMs) {
    const now = Date.now();
    const lastMessageTime = socket._lastMessageTime || 0;

    if (now - lastMessageTime < limitMs) {
        const waitTime = Math.ceil((limitMs - (now - lastMessageTime)) / 1000);
        socket.emit('rate_limited', {
            message: `Wait ${waitTime}s before sending another message.`,
            wait_seconds: waitTime,
        });
        return false;
    }

    socket._lastMessageTime = now;
    return true;
}

/**
 * Authenticate a socket connection via Django backend.
 */
async function authConnection(token, roomId) {
    try {
        const response = await axios.post(`${API_URL}/chat/authenticate_connection`, {
            room_id: roomId || null,
            token: token
        });
        return response.data;
    } catch (error) {
        console.error('Authorization failed:', error?.response?.data || error.message);
        return null;
    }
}

/**
 * Set up a city chat room namespace.
 * Messages are persisted via Django REST API and broadcast via Redis pub/sub.
 * On connect, we just authenticate — message history is loaded by the frontend via REST.
 */
function setupChatRoom(namespace) {
    namespace.on('connection', async (socket) => {
        const roomId = socket.handshake.query.room_id;
        const token = socket.handshake.query.token;

        const authData = await authConnection(token, roomId);

        if (!authData || !authData.username) {
            console.log('User not authorized to join chat room');
            socket.disconnect();
            return;
        }

        const username = authData.username;
        const userId = authData.user_id;

        console.log(`${username} connected to city chat room ${roomId}`);

        // Store user info on the socket for later use
        socket.username = username;
        socket.userId = userId;
        socket.roomId = roomId;

        // Handle send_message — validate, rate-limit, then persist via Django API
        socket.on('send_message', async (msg) => {
            const sanitized = sanitizeMessage(msg);

            if (!sanitized) return;

            if (sanitized.length > CITY_MAX_LENGTH) {
                socket.emit('message_error', {
                    message: `Message too long (max ${CITY_MAX_LENGTH} characters)`
                });
                return;
            }

            if (!checkRateLimit(socket, CITY_RATE_LIMIT_MS)) return;

            try {
                // Persist via Django API
                const response = await axios.post(`${API_URL}/chat/send_city_message`, {
                    room_id: roomId,
                    message: sanitized,
                }, {
                    headers: {
                        'Authorization': `Bearer: ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                // Broadcast to everyone in this namespace
                // (Redis pub/sub will handle this — see server.js)
                // The Django view publishes to Redis, which the server picks up
                // and broadcasts. So we don't need to emit here directly.
            } catch (error) {
                console.error('Error persisting city message:', error?.response?.data || error.message);
                socket.emit('message_error', {
                    message: 'Failed to send message. Try again.'
                });
            }
        });

        socket.on('disconnect', () => {
            console.log(`${username} disconnected from city chat room ${roomId}`);
        });
    });
}

module.exports = {
    setupChatRoom,
    authConnection,
    sanitizeMessage,
    checkRateLimit,
    CITY_RATE_LIMIT_MS,
    DM_RATE_LIMIT_MS,
    CITY_MAX_LENGTH,
    DM_MAX_LENGTH,
};
