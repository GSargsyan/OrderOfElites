const { authConnection } = require('./chatHandler');

/**
 * Set up the notifications namespace for real-time DM delivery.
 * Each user joins a personal room (user_{id}) so we can push DMs to them.
 */
function setupNotifications(io) {
    const notifNamespace = io.of('/notifications');

    notifNamespace.on('connection', async (socket) => {
        const token = socket.handshake.query.token;

        // Authenticate — no room_id needed for notifications
        const authData = await authConnection(token, null);

        if (!authData || !authData.user_id) {
            console.log('Notification connection rejected — invalid token');
            socket.disconnect();
            return;
        }

        const userId = authData.user_id;
        const username = authData.username;

        // Join personal room
        socket.join(`user_${userId}`);
        console.log(`${username} connected to notifications channel`);

        socket.on('disconnect', () => {
            console.log(`${username} disconnected from notifications channel`);
        });
    });

    return notifNamespace;
}

module.exports = { setupNotifications };
