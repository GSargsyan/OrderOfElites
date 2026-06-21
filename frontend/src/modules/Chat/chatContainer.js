import { useState, useEffect, memo } from 'react'
import socketIOClient from "socket.io-client"
import { CHAT_URL } from 'modules/Base/constants.js'
import { request } from 'modules/Base'
import { ChatBoard, MessagesBoard } from 'modules/Chat/chatBoard.js'

const ChatContainer = memo(({ messageUser }) => {
    console.log('ChatContainer rendered')
    const [rooms, setRooms] = useState(null)
    const [activeTab, setActiveTab] = useState(0)

    useEffect(() => {
        if (messageUser !== null) {
            setActiveTab(0)
        }

        request({
            'url': 'chat/get_user_rooms',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setRooms(response.data)
        })
    }, [])

    useEffect(() => {
        if (messageUser === null) {
            return
        }

        setActiveTab(0)
    }, [messageUser])

    if (!rooms) {
        return (
            <div className="chat-panel glass-panel" style={{ padding: '20px' }}>
                <p className="loading-text">LOADING...</p>
            </div>
        )
    }

    const handleTabClick = (index) => {
        setActiveTab(index)
        console.log('clicked tab', index)
    }

    return (
        <div className="chat-panel">
            <div className="chat-tab-bar">
                <div
                    className={`chat-tab ${activeTab === 0 ? 'active' : ''}`}
                    onClick={() => handleTabClick(0)}
                    key={0}
                >
                    Messages
                </div>

                {rooms.map((chat, index) => (
                    <div
                        className={`chat-tab ${activeTab === index + 1 ? 'active' : ''}`}
                        key={chat.id}
                        onClick={() => handleTabClick(index + 1)}
                    >
                        {chat.name}
                    </div>
                ))}
            </div>

            <div className="chat-body">
                {activeTab === 0 && (
                    <MessagesBoard messageUser={messageUser} />
                )}

                {rooms.map((chat, index) => (
                    activeTab === index + 1 && (
                        <ChatBoard
                            key={chat.id}
                            chatRoomId={chat.id}
                            name={chat.name}
                        />
                    )
                ))}
            </div>
        </div>
    )
})

export default ChatContainer