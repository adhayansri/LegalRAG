import React, { useState } from 'react'
import SourceCard from './SourceCard'
import { motion } from 'framer-motion'
import { Copy, Check, Landmark, User, FileText } from 'lucide-react'

export default function MessageBubble({ message }) {
    const isUser = message.sender === 'user'
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error('Failed to copy', e)
        }
    }

    let displayText = message.text
    if (message.fallback && message.citations && message.citations.length > 0) {
        const parts = []
        for (const s of message.citations.slice(0, 3)) {
            const act = s.act || 'Unknown Act'
            const section = s.section || ''
            const snippet = (s.snippet || '').replace(/\s+/g, ' ').trim()
            const sentence = snippet ? snippet : `See Section ${section} of ${act}.`
            parts.push(`According to Section ${section} of ${act}, ${sentence}`)
        }
        displayText = parts.join('\n\n')
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {/* Avatar for Bot */}
            {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                    <Landmark size={14} className="text-sky-400" />
                </div>
            )}

            <div className={`flex flex-col group max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Bubble box */}
                <div 
                    className={`px-5 py-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser 
                            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-tr-none shadow-md shadow-sky-500/5 font-medium' 
                            : 'bg-[#090f1d] border border-white/[0.04] text-slate-100 rounded-tl-none'
                    }`}
                >
                    <div className="whitespace-pre-wrap">{displayText}</div>
                    
                    {/* Copy action inside bubble (visible on hover) */}
                    {!isUser && (
                        <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.04] pt-2.5">
                            <span className="text-[10px] text-slate-500">Legal AI Response</span>
                            <button 
                                onClick={handleCopy} 
                                className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-sky-400 transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <Check size={11} className="text-emerald-400" />
                                        <span className="text-emerald-400">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={11} />
                                        <span>Copy Answer</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Citations section outside bubble */}
                {!isUser && message.citations && message.citations.length > 0 && (
                    <div className="mt-3 w-full space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                            <FileText size={10} />
                            Sources Cited ({message.citations.length})
                        </div>
                        <div className="grid gap-2">
                            {message.citations.map((c, i) => (
                                <SourceCard key={i} source={c} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Avatar for User */}
            {isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-indigo-400" />
                </div>
            )}
        </motion.div>
    )
}
