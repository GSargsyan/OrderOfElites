import React, { useState, useEffect } from 'react'
import socketIOClient from "socket.io-client"
import { CHAT_URL } from 'modules/Base/constants.js'
import { request } from 'modules/Base'


export function ChatBoard({ chatRoomId, name}) {
    console.log('ChatBoard rendered')
    const [socket, setSocket] = useState(null)
    const [messages, setMessages] = useState([])
    const [currentMessage, setCurrentMessage] = useState("")

    useEffect(() => {
        const token = localStorage.getItem('token');
        const newSocket = socketIOClient(`${CHAT_URL}/chat-${chatRoomId}`, {
            query: {
                token: token,
                room_id: chatRoomId,
            }
        })

        setSocket(newSocket)

        newSocket.on("chat_message", new_msg => {
            console.log('received message:', new_msg);
            setMessages(prev => [...prev,
                <div key={prev.length}>
                    <b>{new_msg.username}</b>: {new_msg.message}
                </div>
            ])
        })

        return () => newSocket.disconnect()
    }, [])

    const handleSendMessage = () => {
        if (socket && currentMessage !== "") {
            socket.emit("send_message", currentMessage)
            setCurrentMessage("")
        }
    }

    return (
        <div className="chatBoard" style={styles.chatBoard}>
            <div className="messagesCont" style={styles.messagesCont}>
                {messages}
            </div>
            <div className="chatInput">
                <input
                    className="chatInputField"
                    style={styles.chatInputField}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message..."
                />
                <button className="sendMsgBtn" style={styles.sendMsgBtn}
                    onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    )
}

export function MessagesBoard() {
    const [conversations, setConversations] = useState([])

    useEffect(() => {
        request({
            'url': 'chat/get_conversations',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setConversations(response.data)
        })
    }, [])

    return (
        <div className="chatBoard" style={styles.chatBoard}>
            <div className="conversationsCont" style={styles.conversationsCont}>
                {conversations.map(conversation => (
                    <div className="conversation" key={conversation.username} style={styles.conversationUser}>
                        <b>{conversation.username}</b>: {conversation.last_message}
                    </div>
                ))}
            </div>
        </div>
    )
}

const styles = {
    chatBoard: {
        border: '1px solid black',
        height: '100%',
    },
    messagesCont: {
        padding: '5px',
        height: '90%',
        overflow: 'scroll'
    },
    sendMsgBtn: {
        marginLeft: '10px',
        width: '15%',
    },
    chatInputField: {
        marginLeft: '10px',
        width: '70%',
    }
}