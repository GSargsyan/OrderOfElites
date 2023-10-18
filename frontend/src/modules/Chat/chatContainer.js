import React, { useState, useEffect } from 'react'
import socketIOClient from "socket.io-client"
import { CHAT_URL } from 'modules/Base/constants.js'


function ChatContainer() {
    const [socket, setSocket] = useState(null)
    const [messages, setMessages] = useState([])
    const [currentMessage, setCurrentMessage] = useState("")

    useEffect(() => {
        const newSocket = socketIOClient(CHAT_URL)
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
        <div style={styles.chatCont}>
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
    chatCont: {
        position: 'absolute',
        top: '30%',
        width: '30%',
        height: '50%',
        border: '1px solid black'
    }
}


export default ChatContainer
