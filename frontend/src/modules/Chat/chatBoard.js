import React, { useState, useEffect } from 'react'
import socketIOClient from "socket.io-client"
import { CHAT_URL } from 'modules/Base/constants.js'
import { request } from 'modules/Base'


function ChatBoard({ chatRoomId, name}) {
    const [socket, setSocket] = useState(null)
    const [messages, setMessages] = useState([])
    const [currentMessage, setCurrentMessage] = useState("")

    useEffect(() => {
        const token = localStorage.getItem('token');
        const newSocket = socketIOClient(`${CHAT_URL}/chat-${chatRoomId}`, {
            query: {
                token: token,
                room_id: chatRoomId
            }
        })

        setSocket(newSocket)

        newSocket.on("chat_message", data => {
            setMessages(prev => [...prev, data])
        })

        return () => newSocket.disconnect()
    }, [])

    const handleSendMessage = () => {
        if (socket) {
            socket.emit("send_message", currentMessage)
            setCurrentMessage("")
        }
    }

    return (
        <div style={styles.chatBoard}>
            <div className="chatBoard">
                {messages.map((message, index) => (
                    <div key={index}>{message}</div>
                ))}
            </div>
            <div className="chatInput">
                <input 
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message..."
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    )
}

const styles = {
    chatBoard: {
        position: 'absolute',
        left: '50%',
        top: '25%',
        transform: 'translateX(-50%)',
        width: '90%',
        height: '70%',
        border: '1px solid black'
    }
}

export default ChatBoard