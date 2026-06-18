import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import ChatWindow from './components/ChatWindow'

const SESSIONS_KEY = 'legalrag_sessions_v2'
const CURRENT_SESSION_KEY = 'legalrag_current_session_v2'

export default function App() {
    const [sessions, setSessions] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || []
        } catch (e) {
            return []
        }
    })
    const [currentSessionId, setCurrentSessionId] = useState(() => {
        return localStorage.getItem(CURRENT_SESSION_KEY) || null
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Save sessions to localStorage
    useEffect(() => {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
    }, [sessions])

    // Save current session ID
    useEffect(() => {
        if (currentSessionId) {
            localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId)
        } else {
            localStorage.removeItem(CURRENT_SESSION_KEY)
        }
    }, [currentSessionId])

    // Helper to initialize session
    const handleNewChat = () => {
        const newId = 'session_' + Date.now()
        const newSession = {
            id: newId,
            name: '',
            messages: [],
            created_at: new Date().toISOString()
        }
        setSessions(prev => [newSession, ...prev])
        setCurrentSessionId(newId)
        setIsSidebarOpen(false)
    }

    // If there are no sessions, create one automatically
    useEffect(() => {
        if (sessions.length === 0) {
            handleNewChat()
        } else if (!currentSessionId) {
            setCurrentSessionId(sessions[0].id)
        }
    }, [])

    const handleClearAll = () => {
        setSessions([])
        setCurrentSessionId(null)
        localStorage.removeItem(SESSIONS_KEY)
        localStorage.removeItem(CURRENT_SESSION_KEY)
        // Auto-create one fresh empty session
        const newId = 'session_' + Date.now()
        const newSession = {
            id: newId,
            name: '',
            messages: [],
            created_at: new Date().toISOString()
        }
        setSessions([newSession])
        setCurrentSessionId(newId)
    }

    const handleSelectSession = (id) => {
        setCurrentSessionId(id)
        setIsSidebarOpen(false)
    }

    const handleDeleteSession = (id, e) => {
        e?.stopPropagation()
        const updated = sessions.filter(s => s.id !== id)
        setSessions(updated)
        if (currentSessionId === id) {
            if (updated.length > 0) {
                setCurrentSessionId(updated[0].id)
            } else {
                const newId = 'session_' + Date.now()
                setSessions([{
                    id: newId,
                    name: '',
                    messages: [],
                    created_at: new Date().toISOString()
                }])
                setCurrentSessionId(newId)
            }
        }
    }

    const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0] || {
        id: 'fallback',
        name: '',
        messages: []
    }

    const updateCurrentSessionMessages = (newMessages, firstMessageText = null) => {
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                const name = s.name || firstMessageText || ''
                return {
                    ...s,
                    name: name.slice(0, 40) + (name.length > 40 ? '...' : ''),
                    messages: newMessages
                }
            }
            return s
        }))
    }

    const filteredSessions = sessions.filter(s => {
        const title = s.name || 'New Consultation'
        return title.toLowerCase().includes(searchQuery.toLowerCase())
    })

    return (
        <div className="min-h-screen flex bg-[#030712] text-slate-100 overflow-hidden font-sans">
            {/* Sidebar drawer for mobile, default sidebar for desktop */}
            <div className={`fixed inset-0 z-50 md:relative md:flex md:inset-auto ${isSidebarOpen ? 'flex' : 'hidden md:flex'}`}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 md:hidden" onClick={() => setIsSidebarOpen(false)} />
                <aside className="relative w-72 h-full bg-[#0b1120] border-r border-white/5 flex flex-col z-10">
                    <Sidebar 
                        sessions={filteredSessions}
                        currentSessionId={currentSessionId}
                        onNewChat={handleNewChat}
                        onClearChat={handleClearAll}
                        onSelectSession={handleSelectSession}
                        onDeleteSession={handleDeleteSession}
                        onSearch={setSearchQuery}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </aside>
            </div>

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Navbar onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
                <main className="flex-1 overflow-hidden relative flex flex-col bg-[#060b16]">
                    <ChatWindow 
                        session={currentSession}
                        onUpdateMessages={updateCurrentSessionMessages}
                    />
                </main>
            </div>
        </div>
    )
}
