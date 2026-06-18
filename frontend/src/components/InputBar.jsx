import React, { useRef, useEffect } from 'react'
import { Send, CornerDownLeft } from 'lucide-react'

export default function InputBar({ value, onChange, onSend, loading }) {
    const textareaRef = useRef(null)

    // Auto-resize the text area based on lines of text
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
        }
    }, [value])

    const handleKeyDown = (e) => {
        // Submit on Enter, unless Shift is pressed
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
    }

    return (
        <div className="relative flex items-end gap-2.5 bg-slate-900/60 focus-within:bg-slate-950/80 border border-white/[0.04] focus-within:border-sky-500/25 rounded-2xl p-2 transition-all duration-200 shadow-inner">
            <textarea 
                ref={textareaRef}
                value={value} 
                onChange={e => onChange(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal question (e.g. IPC code definitions, corporate statutes...)" 
                rows={1}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-100 placeholder-slate-500 text-xs sm:text-sm resize-none focus:outline-none max-h-40 min-h-[36px] py-2 px-3 leading-relaxed" 
            />
            
            <div className="flex items-center gap-2 pr-1 pb-1">
                {/* Enter shortcut tip (only on desktop) */}
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-600 bg-white/5 border border-white/[0.02] px-1.5 py-1 rounded">
                    <span>Enter</span>
                    <CornerDownLeft size={8} />
                </span>

                <button 
                    onClick={onSend} 
                    disabled={loading || !value.trim()} 
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
                        loading || !value.trim() 
                            ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                            : 'bg-sky-500 hover:bg-sky-400 text-slate-900 shadow-md shadow-sky-500/10'
                    }`}
                >
                    <Send size={14} className={loading ? 'animate-pulse' : ''} />
                </button>
            </div>
        </div>
    )
}
