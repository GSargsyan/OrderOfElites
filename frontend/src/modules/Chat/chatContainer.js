import React, { useState, useEffect } from 'react'
import socketIOClient from "socket.io-client"
import { CHAT_URL } from 'modules/Base/constants.js'
import { request } from 'modules/Base'
import ChatBoard from 'modules/Chat/chatBoard.js'

function ChatContainer() {
    const [data, setData] = useState(null)

    useEffect(() => {
        request({
            'url': 'chat/get_user_connections',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setData(response.data)
        })
    }, [])

    if (data === null) {
        return <div>Loading...</div>;
    }

    return (
        <div style={styles.chatCont}>
            {data.map(chat => (
                <div key={chat.id} style={styles.chatTab}>
                    <p>{chat.name}</p>
                    <ChatBoard
                        chatRoomId={chat.id}
                        name={chat.name}
                    />
                </div>
            ))}
        </div>
    )
}

// request to get all users

const styles = {
    chatCont: {
        position: 'absolute',
        top: '30%',
        width: '30%',
        height: '50%',
        border: '1px solid black'
    },
    chatTab: {
        border: '1px solid black',
        margin: '5px',
        padding: '5px'
    }
}


export default ChatContainer