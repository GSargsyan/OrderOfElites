import axios from 'axios'
import React, { useState } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import { API_URL } from 'modules/Base'


function Dashboard() {
    return (
        <div>
            <ChatContainer />
        </div>
    )
}

const styles = {
    formGroup: {
        marginBottom: '15px'
    }
}

export default Dashboard
