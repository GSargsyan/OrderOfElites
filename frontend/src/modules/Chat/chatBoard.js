import React, { useState, useEffect, useRef, useCallback } from 'react'
import socketIOClient from "socket.io-client"
import { CHAT_URL } from 'modules/Base/constants.js'
import { request } from 'modules/Base'


/**
 * ChatBoard — City chat room component.
 * Loads message history on mount, supports scroll-up pagination,
 * handles real-time messages via Socket.IO, and includes rate-limit feedback.
 */
export function ChatBoard({ chatRoomId, name }) {
    const [socket, setSocket] = useState(null)
    const [messages, setMessages] = useState([])
    const [currentMessage, setCurrentMessage] = useState("")
    const [rateLimitMsg, setRateLimitMsg] = useState(null)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [hasMoreHistory, setHasMoreHistory] = useState(true)
    const [initialLoadDone, setInitialLoadDone] = useState(false)
    const messagesEndRef = useRef(null)
    const messagesAreaRef = useRef(null)
    const chatInputRef = useRef(null)
    const shouldAutoScroll = useRef(true)

    // Load initial message history
    useEffect(() => {
        request({
            url: 'chat/get_city_messages',
            method: 'POST',
            data: { room_id: chatRoomId },
        }).then(response => {
            setMessages(response.data)
            setHasMoreHistory(response.data.length >= 50)
            setInitialLoadDone(true)
        }).catch(err => {
            console.error('Failed to load city messages:', err)
            setInitialLoadDone(true)
        })
    }, [chatRoomId])

    // Auto-scroll to bottom when initial messages load
    useEffect(() => {
        if (initialLoadDone && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView()
        }
    }, [initialLoadDone])

    // Socket.IO connection
    useEffect(() => {
        const token = localStorage.getItem('token')
        const newSocket = socketIOClient(`${CHAT_URL}/chat-${chatRoomId}`, {
            query: { token, room_id: chatRoomId }
        })

        setSocket(newSocket)

        newSocket.on('chat_message', (newMsg) => {
            setMessages(prev => [...prev, newMsg])
        })

        newSocket.on('rate_limited', (data) => {
            setRateLimitMsg(data.message)
            setTimeout(() => setRateLimitMsg(null), data.wait_seconds * 1000)
        })

        newSocket.on('message_error', (data) => {
            setRateLimitMsg(data.message)
            setTimeout(() => setRateLimitMsg(null), 3000)
        })

        return () => newSocket.disconnect()
    }, [chatRoomId])

    // Auto-scroll on new messages (if user hasn't scrolled up)
    useEffect(() => {
        if (shouldAutoScroll.current && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // Track scroll position to determine auto-scroll behavior
    const handleScroll = useCallback(() => {
        const el = messagesAreaRef.current
        if (!el) return

        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        shouldAutoScroll.current = distanceFromBottom < 60

        // Load more history when scrolled to top
        if (el.scrollTop < 40 && hasMoreHistory && !loadingHistory && messages.length > 0) {
            loadOlderMessages()
        }
    }, [hasMoreHistory, loadingHistory, messages])

    const loadOlderMessages = useCallback(() => {
        if (loadingHistory || !hasMoreHistory || messages.length === 0) return

        setLoadingHistory(true)
        const oldestId = messages[0]?.id

        const el = messagesAreaRef.current
        const prevScrollHeight = el ? el.scrollHeight : 0

        request({
            url: 'chat/get_city_messages',
            method: 'POST',
            data: { room_id: chatRoomId, before_id: oldestId },
        }).then(response => {
            const olderMsgs = response.data
            if (olderMsgs.length < 50) {
                setHasMoreHistory(false)
            }
            setMessages(prev => [...olderMsgs, ...prev])
            setLoadingHistory(false)

            // Maintain scroll position after prepending
            requestAnimationFrame(() => {
                if (el) {
                    el.scrollTop = el.scrollHeight - prevScrollHeight
                }
            })
        }).catch(() => {
            setLoadingHistory(false)
        })
    }, [chatRoomId, loadingHistory, hasMoreHistory, messages])

    const handleSendMessage = () => {
        if (socket && currentMessage.trim() !== "") {
            socket.emit("send_message", currentMessage.trim())
            setCurrentMessage("")
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const formatTime = (isoString) => {
        const date = new Date(isoString)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Group messages by date for date dividers
    const getDateLabel = (isoString) => {
        const date = new Date(isoString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) return 'Today'
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    let lastDateLabel = null

    return (
        <>
            <div
                className="chat-messages-area"
                ref={messagesAreaRef}
                onScroll={handleScroll}
            >
                {loadingHistory && (
                    <div className="chat-loading-spinner">Loading history...</div>
                )}
                {!hasMoreHistory && messages.length > 0 && (
                    <div className="chat-history-start">
                        — Beginning of conversation —
                    </div>
                )}
                {messages.map((msg) => {
                    const dateLabel = msg.created_at ? getDateLabel(msg.created_at) : null
                    let showDateDivider = false
                    if (dateLabel && dateLabel !== lastDateLabel) {
                        showDateDivider = true
                        lastDateLabel = dateLabel
                    }

                    return (
                        <React.Fragment key={msg.id}>
                            {showDateDivider && (
                                <div className="chat-date-divider">
                                    <span>{dateLabel}</span>
                                </div>
                            )}
                            <div className="chat-message">
                                <span className="chat-msg-username">{msg.username}</span>
                                <span className="chat-msg-separator">: </span>
                                <span className="chat-msg-text">{msg.message}</span>
                                {msg.created_at && (
                                    <span className="chat-msg-time">{formatTime(msg.created_at)}</span>
                                )}
                            </div>
                        </React.Fragment>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {rateLimitMsg && (
                <div className="chat-rate-limit-notice">{rateLimitMsg}</div>
            )}

            <div className="chat-input-area">
                <input
                    ref={chatInputRef}
                    className="chat-input-field"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Transmit to operatives..."
                    maxLength={100}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim()}
                >Send</button>
            </div>
        </>
    )
}


/**
 * MessagesBoard — DM conversations component.
 * Two views: conversation list and conversation detail (message history).
 */
export function MessagesBoard({ messageUser, onMessageUserHandled, notifSocket }) {
    const [conversations, setConversations] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [dmMessages, setDmMessages] = useState([])
    const [currentMessage, setCurrentMessage] = useState("")
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [hasMoreHistory, setHasMoreHistory] = useState(true)
    const [sendingMessage, setSendingMessage] = useState(false)
    const messagesEndRef = useRef(null)
    const messagesAreaRef = useRef(null)
    const shouldAutoScroll = useRef(true)

    // Load conversations list
    const loadConversations = useCallback(() => {
        request({
            url: 'chat/get_dm_conversations',
            method: 'POST',
        }).then(response => {
            setConversations(response.data)
            setLoadingConversations(false)
        }).catch(() => {
            setLoadingConversations(false)
        })
    }, [])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    // Handle incoming messageUser prop (from profile modal "Message" click)
    useEffect(() => {
        if (messageUser) {
            setSelectedUser(messageUser)
            if (onMessageUserHandled) {
                onMessageUserHandled()
            }
        }
    }, [messageUser, onMessageUserHandled])

    // Load messages when a conversation is selected
    useEffect(() => {
        if (!selectedUser) return

        setLoadingMessages(true)
        setHasMoreHistory(true)
        setDmMessages([])

        request({
            url: 'chat/get_dm_messages',
            method: 'POST',
            data: { username: selectedUser },
        }).then(response => {
            setDmMessages(response.data)
            setHasMoreHistory(response.data.length >= 50)
            setLoadingMessages(false)

            // Scroll to bottom
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView()
                }
            }, 50)
        }).catch(() => {
            setLoadingMessages(false)
        })

        // Mark messages as read
        request({
            url: 'chat/mark_messages_read',
            method: 'POST',
            data: { username: selectedUser },
        })
    }, [selectedUser])

    // Listen for real-time DMs via notification socket
    useEffect(() => {
        if (!notifSocket) return

        const handleNewDm = (data) => {
            if (selectedUser) {
                // If we're in a conversation with this user, add the message
                if (data.username === selectedUser) {
                    setDmMessages(prev => {
                        // Deduplicate by ID
                        if (prev.some(m => m.id === data.id)) return prev
                        return [...prev, {
                            id: data.id,
                            username: data.username,
                            message: data.message,
                            is_mine: false,
                            created_at: data.created_at,
                        }]
                    })

                    // Mark as read since we're viewing
                    request({
                        url: 'chat/mark_messages_read',
                        method: 'POST',
                        data: { username: selectedUser },
                    })
                }
            }

            // Refresh conversations list to update last message / unread counts
            loadConversations()
        }

        notifSocket.on('new_dm', handleNewDm)
        return () => notifSocket.off('new_dm', handleNewDm)
    }, [notifSocket, selectedUser, loadConversations])

    // Auto-scroll on new messages
    useEffect(() => {
        if (shouldAutoScroll.current && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [dmMessages])

    const handleScroll = useCallback(() => {
        const el = messagesAreaRef.current
        if (!el) return

        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        shouldAutoScroll.current = distanceFromBottom < 60

        // Load more history when scrolled to top
        if (el.scrollTop < 40 && hasMoreHistory && !loadingMessages && dmMessages.length > 0) {
            loadOlderMessages()
        }
    }, [hasMoreHistory, loadingMessages, dmMessages])

    const loadOlderMessages = useCallback(() => {
        if (loadingMessages || !hasMoreHistory || dmMessages.length === 0 || !selectedUser) return

        const oldestId = dmMessages[0]?.id
        const el = messagesAreaRef.current
        const prevScrollHeight = el ? el.scrollHeight : 0

        setLoadingMessages(true)
        request({
            url: 'chat/get_dm_messages',
            method: 'POST',
            data: { username: selectedUser, before_id: oldestId },
        }).then(response => {
            const olderMsgs = response.data
            if (olderMsgs.length < 50) {
                setHasMoreHistory(false)
            }
            setDmMessages(prev => [...olderMsgs, ...prev])
            setLoadingMessages(false)

            requestAnimationFrame(() => {
                if (el) {
                    el.scrollTop = el.scrollHeight - prevScrollHeight
                }
            })
        }).catch(() => {
            setLoadingMessages(false)
        })
    }, [selectedUser, loadingMessages, hasMoreHistory, dmMessages])

    const handleSendDm = () => {
        if (!currentMessage.trim() || !selectedUser || sendingMessage) return

        setSendingMessage(true)
        request({
            url: 'chat/send_dm',
            method: 'POST',
            data: {
                username: selectedUser,
                message: currentMessage.trim(),
            },
        }).then(response => {
            const newMsg = response.data
            setDmMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev
                return [...prev, {
                    id: newMsg.id,
                    username: newMsg.username,
                    message: newMsg.message,
                    is_mine: true,
                    created_at: newMsg.created_at,
                }]
            })
            setCurrentMessage("")
            setSendingMessage(false)
            shouldAutoScroll.current = true

            // Refresh conversations list
            loadConversations()
        }).catch(err => {
            console.error('Failed to send DM:', err)
            setSendingMessage(false)
        })
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendDm()
        }
    }

    const handleBackClick = () => {
        setSelectedUser(null)
        setDmMessages([])
        setHasMoreHistory(true)
        loadConversations()
    }

    const formatTime = (isoString) => {
        const date = new Date(isoString)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const formatRelativeTime = (isoString) => {
        const now = new Date()
        const date = new Date(isoString)
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'now'
        if (diffMins < 60) return `${diffMins}m`
        if (diffHours < 24) return `${diffHours}h`
        if (diffDays < 7) return `${diffDays}d`
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    const getDateLabel = (isoString) => {
        const date = new Date(isoString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) return 'Today'
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    // ── Conversation Detail View ──
    if (selectedUser) {
        let lastDateLabel = null

        return (
            <>
                <div className="dm-conversation-header">
                    <button className="dm-back-btn" onClick={handleBackClick}>
                        ← Back
                    </button>
                    <span className="dm-conversation-title">{selectedUser}</span>
                </div>

                <div
                    className="chat-messages-area dm-messages-area"
                    ref={messagesAreaRef}
                    onScroll={handleScroll}
                >
                    {loadingMessages && dmMessages.length === 0 && (
                        <div className="chat-loading-spinner">Loading messages...</div>
                    )}
                    {loadingMessages && dmMessages.length > 0 && (
                        <div className="chat-loading-spinner">Loading history...</div>
                    )}
                    {!hasMoreHistory && dmMessages.length > 0 && (
                        <div className="chat-history-start">
                            — Beginning of conversation —
                        </div>
                    )}

                    {dmMessages.map((msg) => {
                        const dateLabel = msg.created_at ? getDateLabel(msg.created_at) : null
                        let showDateDivider = false
                        if (dateLabel && dateLabel !== lastDateLabel) {
                            showDateDivider = true
                            lastDateLabel = dateLabel
                        }

                        const isMine = msg.is_mine || msg.username !== selectedUser

                        return (
                            <React.Fragment key={msg.id}>
                                {showDateDivider && (
                                    <div className="chat-date-divider">
                                        <span>{dateLabel}</span>
                                    </div>
                                )}
                                <div className={`dm-message-bubble ${isMine ? 'dm-sent' : 'dm-received'}`}>
                                    <div className="dm-message-text">{msg.message}</div>
                                    <div className="dm-message-time">
                                        {msg.created_at && formatTime(msg.created_at)}
                                    </div>
                                </div>
                            </React.Fragment>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {dmMessages.length === 0 && !loadingMessages && (
                    <div className="chat-empty-state">
                        No messages yet. Send the first transmission.
                    </div>
                )}

                <div className="chat-input-area">
                    <input
                        className="chat-input-field"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Compose secure message..."
                        maxLength={500}
                        autoFocus
                    />
                    <button
                        className="chat-send-btn"
                        onClick={handleSendDm}
                        disabled={!currentMessage.trim() || sendingMessage}
                    >Send</button>
                </div>
            </>
        )
    }

    // ── Conversation List View ──
    return (
        <div className="dm-conversation-list">
            {loadingConversations && (
                <div className="chat-loading-spinner">Loading conversations...</div>
            )}

            {!loadingConversations && conversations.length === 0 && (
                <div className="chat-empty-state">
                    No transmissions yet.
                    <br />
                    <span className="chat-empty-hint">
                        Visit a player's profile to initiate contact.
                    </span>
                </div>
            )}

            {conversations.map(conv => (
                <div
                    className="dm-conversation-row"
                    key={conv.room_id}
                    onClick={() => setSelectedUser(conv.username)}
                >
                    <div className="dm-conv-top-row">
                        <span className="dm-conv-username">{conv.username}</span>
                        <span className="dm-conv-time">
                            {formatRelativeTime(conv.last_message_time)}
                        </span>
                    </div>
                    <div className="dm-conv-bottom-row">
                        <span className="dm-conv-preview">
                            {conv.is_mine && <span className="dm-conv-you">You: </span>}
                            {conv.last_message}
                        </span>
                        {conv.unread_count > 0 && (
                            <span className="dm-unread-badge">{conv.unread_count}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}