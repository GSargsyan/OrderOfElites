import { useState, useEffect, useRef, memo, useCallback } from 'react'
import socketIOClient from "socket.io-client"
import { CHAT_URL } from 'modules/Base/constants.js'
import { request } from 'modules/Base'
import { ChatBoard, MessagesBoard } from 'modules/Chat/chatBoard.js'

const ChatContainer = memo(({ messageUser }) => {
    const [rooms, setRooms] = useState(null)
    const [activeTab, setActiveTab] = useState(0)
    const [notifSocket, setNotifSocket] = useState(null)
    const [totalUnread, setTotalUnread] = useState(0)
    const [messageUserState, setMessageUserState] = useState(null)

    // Load chat rooms
    useEffect(() => {
        request({
            url: 'chat/get_user_rooms',
            method: 'POST',
        }).then(response => {
            setRooms(response.data)
        })
    }, [])

    // Connect to notifications namespace for real-time DMs
    useEffect(() => {
        const token = localStorage.getItem('token')
        const socket = socketIOClient(`${CHAT_URL}/notifications`, {
            query: { token }
        })

        setNotifSocket(socket)

        // Track unread count updates
        socket.on('new_dm', () => {
            // Refresh unread count from conversations
            refreshUnreadCount()
        })

        return () => socket.disconnect()
    }, [])

    const refreshUnreadCount = useCallback(() => {
        request({
            url: 'chat/get_dm_conversations',
            method: 'POST',
        }).then(response => {
            const total = response.data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
            setTotalUnread(total)
        })
    }, [])

    // Initial unread count load
    useEffect(() => {
        refreshUnreadCount()
    }, [refreshUnreadCount])

    // Handle messageUser prop from profile modal
    useEffect(() => {
        if (messageUser && rooms) {
            setActiveTab(rooms.length)  // Switch to Messages tab
            setMessageUserState(messageUser)
        }
    }, [messageUser, rooms])

    // Clear messageUser after it's been handled by MessagesBoard
    const handleMessageUserHandled = useCallback(() => {
        setMessageUserState(null)
    }, [])

    if (!rooms) {
        return (
            <div className="chat-panel glass-panel" style={{ padding: '20px' }}>
                <p className="loading-text">LOADING...</p>
            </div>
        )
    }

    const handleTabClick = (index) => {
        setActiveTab(index)
        // Clear unread when switching to Messages tab
        if (index === rooms.length) {
            refreshUnreadCount()
        }
    }

    return (
        <div className="chat-panel">
            <div className="chat-tab-bar">
                {rooms.map((chat, index) => (
                    <div
                        className={`chat-tab ${activeTab === index ? 'active' : ''}`}
                        key={chat.id}
                        onClick={() => handleTabClick(index)}
                    >
                        {chat.name}
                    </div>
                ))}

                <div
                    className={`chat-tab ${activeTab === rooms.length ? 'active' : ''}`}
                    onClick={() => handleTabClick(rooms.length)}
                    key="messages"
                >
                    Messages
                    {totalUnread > 0 && (
                        <span className="chat-tab-badge">{totalUnread}</span>
                    )}
                </div>
            </div>

            <div className="chat-body">
                {rooms.map((chat, index) => (
                    activeTab === index && (
                        <ChatBoard
                            key={chat.id}
                            chatRoomId={chat.id}
                            name={chat.name}
                        />
                    )
                ))}

                {activeTab === rooms.length && (
                    <MessagesBoard
                        messageUser={messageUserState}
                        onMessageUserHandled={handleMessageUserHandled}
                        notifSocket={notifSocket}
                    />
                )}
            </div>
        </div>
    )
})

export default ChatContainer