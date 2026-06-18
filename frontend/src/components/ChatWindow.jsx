import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import { motion, AnimatePresence } from 'framer-motion'
import { Landmark, Scale, HelpCircle, AlertCircle, Compass } from 'lucide-react'

export default function ChatWindow({ session, onUpdateMessages }) {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef()

    const messages = session?.messages || []

    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const suggested = [
        { label: "What is theft?", desc: "Define Section 378 of IPC and its general elements." },
        { label: "Explain Section 43 IT Act", desc: "Understand penalty for damage to computer systems." },
        { label: "Powers of SEBI", desc: "Briefly outline statutory duties of Securities & Exchange Board." },
        { label: "What is anticipatory bail?", desc: "Review Section 438 of CrPC regarding pre-arrest bail." }
    ]

    const handleSend = async (customText = null) => {
        const textToSend = customText || input
        if (!textToSend.trim() || loading) return

        const userMsg = { id: 'user_' + Date.now(), sender: 'user', text: textToSend }
        const newMessages = [...messages, userMsg]
        
        // Save user message immediately & set session title if it's the first message
        const isFirstMessage = messages.length === 0
        onUpdateMessages(newMessages, isFirstMessage ? textToSend : null)
        setInput('')
        setLoading(true)

        try {
            // Send request to Django. Send session.backendSessionId if it exists.
            const payload = { 
                prompt: userMsg.text, 
                session_id: session?.backendSessionId || null 
            }
            const res = await axios.post('/api/chat/', payload)
            const data = res.data

            // Map response message
            const botMsg = { 
                id: data.message_id || 'bot_' + Date.now(), 
                sender: 'bot', 
                text: data.answer, 
                citations: data.sources || [], 
                fallback: !!data.fallback 
            }

            // Update session's messages list & record the backend session id
            const updatedMessages = [...newMessages, botMsg]
            onUpdateMessages(updatedMessages)

            if (data.session_id && !session.backendSessionId) {
                // If it's a new backend session, record the ID
                session.backendSessionId = data.session_id
            }

        } catch (err) {
            console.error(err)
            const errMsg = { 
                id: 'error_' + Date.now(), 
                sender: 'bot', 
                text: 'Error: could not fetch legal details. Please check connection.', 
                citations: [] 
            }
            onUpdateMessages([...newMessages, errMsg])
        } finally { 
            setLoading(false) 
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            
            {/* Scrollable Chat History */}
            <div className="flex-1 overflow-y-auto custom-scroll px-4 md:px-6 py-6 space-y-6">
                
                {messages.length === 0 ? (
                    // Empty State Screen
                    <div className="max-w-2xl mx-auto py-12 flex flex-col items-center justify-center text-center">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 border border-sky-500/20 flex items-center justify-center mb-6 shadow-xl shadow-sky-500/5"
                        >
                            <Landmark className="w-8 h-8 text-sky-400" />
                        </motion.div>
                        
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
                            Indian Legal Knowledge Library
                        </h2>
                        <p className="text-sm text-slate-400 max-w-md mb-10">
                            Query Indian acts, penal codes, and guidelines. Answers are verified and cited directly from statutory archives.
                        </p>

                        <div className="w-full grid sm:grid-cols-2 gap-4">
                            {suggested.map((s, idx) => (
                                <motion.div 
                                    key={s.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                                    onClick={() => handleSend(s.label)}
                                    className="p-4 rounded-2xl bg-[#090f1d] hover:bg-slate-900 border border-white/[0.04] hover:border-sky-500/20 text-left cursor-pointer transition-all duration-200 group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Compass className="w-4 h-4 text-sky-400 group-hover:text-sky-300 transition-colors" />
                                        <div className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                                            {s.label}
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                                        {s.desc}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Chat Thread
                    <div className="max-w-3xl mx-auto space-y-6">
                        <AnimatePresence initial={false}>
                            {messages.map(m => (
                                <MessageBubble key={m.id} message={m} />
                            ))}
                        </AnimatePresence>

                        {/* Loading indicator */}
                        {loading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/[0.04]">
                                    <Landmark className="w-4 h-4 text-sky-400" />
                                </div>
                                <div className="px-5 py-4 rounded-2xl bg-[#090f1d] border border-white/[0.04] flex items-center justify-center gap-1 min-w-[80px]">
                                    <div className="dot-flashing" />
                                </div>
                            </motion.div>
                        )}
                        <div ref={bottomRef} className="h-10" />
                    </div>
                )}
            </div>

            {/* Float Input Action Bar */}
            <div className="p-4 md:p-6 border-t border-white/[0.04] bg-[#070b13]">
                <div className="max-w-3xl mx-auto">
                    <InputBar 
                        value={input} 
                        onChange={setInput} 
                        onSend={() => handleSend()} 
                        loading={loading} 
                    />
                    <div className="mt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
                        <AlertCircle size={10} className="text-slate-600" />
                        AI model references internal code archives. For legal counseling, cross-check specific state gazettes.
                    </div>
                </div>
            </div>

        </div>
    )
}
