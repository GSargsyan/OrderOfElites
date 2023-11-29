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

        console.log('------------------------------')
        console.log('activeTab', activeTab)
        console.log('------------------------------')
    }, [messageUser])

    if (!rooms) {
        return <div>Loading...</div>;
    }

    const handleTabClick = (index) => {
        setActiveTab(index)
        console.log('clicked tab', index)
    }

    return (
        <div className="chatCont" style={styles.chatCont}>
            <div className="chatTabCont" style={styles.chatTabCont}>
                <div
                    className="chatTab"
                    onClick={() => handleTabClick(0)}
                    key={0}
                    style={activeTab === 0 ? { ...styles.chatTab, ...styles.activeChatTab } : { ...styles.chatTab }}>
                    <p>Messages</p>
                </div>

                {rooms.map((chat, index) => (
                    <div
                        className="chatTab"
                        key={chat.id}
                        onClick={() => handleTabClick(index + 1)} // +1 because 0 is reserved for Messages tab
                        style={activeTab === index + 1 ? { ...styles.chatTab, ...styles.activeChatTab } : { ...styles.chatTab }}>
                        <p>{chat.name}</p>
                    </div>
                ))}
            </div>

            {activeTab === 0 && (
                <div className="chatBoardCont" style={styles.chatBoardCont}>
                    <MessagesBoard messageUser={messageUser} />
                </div>
            )}

            {rooms.map((chat, index) => (
                activeTab === index + 1 && (
                    <div
                        key={chat.id}
                        className="chatBoardCont"
                        style={styles.chatBoardCont}>
                        <ChatBoard
                            chatRoomId={chat.id}
                            name={chat.name}
                        />
                    </div>
                )
            ))}
        </div>
    )
})

const styles = {
    chatCont: {
        top: '250px',
        width: '20%',
        border: '1px solid black',
    },
    chatBoardCont: {
        height: '84%',
        padding: '10px',
    },
    chatTabCont: {
        padding: '5px',
    },
    chatTab: {
        border: '1px solid black',
        borderTopLeftRadius: '15px',
        borderTopRightRadius: '15px',
        padding: '0 10px',
        display: 'inline-block',
    },
    activeChatTab: {
        fontWeight: 'bold',
    }
}

export default ChatContainer