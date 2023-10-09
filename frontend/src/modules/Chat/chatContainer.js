import axios from 'axios'
import React, { useState } from 'react'

import { API_URL } from 'modules/Base'


function ChatContainer() {
    return (
        <div style={styles.chatCont}>
            test
        </div>
    )
}

const styles = {
    chatCont: {
        border: '2px solid black',
        position: 'absolute',
        top: '30%',
        width: '30%',
        height: '50%',
        border: '1px solid black'
    }
}

export default ChatContainer
