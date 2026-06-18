import React from 'react'
import { Search, Plus, Trash2, X, MessageSquare, Scale } from 'lucide-react'

export default function Sidebar({ 
    sessions = [], 
    currentSessionId, 
    onNewChat, 
    onClearChat, 
    onSelectSession, 
    onDeleteSession, 
    onSearch, 
    onClose 
}) {
    return (
        <div className="flex flex-col h-full bg-[#090f1d] border-r border-white/[0.04]">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#38bdf8] to-[#6366f1] flex items-center justify-center shadow-lg shadow-sky-500/10">
                        <Scale className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-sm tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            LEGALRAG
                        </div>
                        <div className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
                            AI Legal Assistant
                        </div>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button 
                    onClick={onClose} 
                    className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 flex gap-2">
                <button 
                    onClick={onNewChat} 
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-900 transition-all duration-200 active:scale-[0.98] shadow-md shadow-sky-500/10"
                >
                    <Plus size={14} strokeWidth={2.5} />
                    New Consultation
                </button>
                <button 
                    onClick={onClearChat} 
                    className="p-2.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/[0.03] hover:border-rose-500/20 transition-all duration-200"
                    title="Clear All Sessions"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-2">
                <div className="relative">
                    <input 
                        onChange={e => onSearch?.(e.target.value)} 
                        placeholder="Search consultations..." 
                        className="w-full bg-white/[0.02] hover:bg-white/[0.04] focus:bg-slate-900/60 border border-white/[0.05] focus:border-sky-500/30 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all duration-200" 
                    />
                    <div className="absolute left-3 top-2.5 text-slate-500">
                        <Search size={14} />
                    </div>
                </div>
            </div>

            {/* Scrollable Session List */}
            <div className="flex-1 overflow-y-auto custom-scroll px-3 py-2 space-y-1">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                    Recent History
                </div>
                {sessions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                        No matches found
                    </div>
                ) : (
                    sessions.map(s => {
                        const isActive = s.id === currentSessionId
                        return (
                            <div 
                                key={s.id}
                                onClick={() => onSelectSession?.(s.id)}
                                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-gradient-to-r from-sky-500/10 to-indigo-500/5 text-sky-400 border border-sky-500/10' 
                                        : 'hover:bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <MessageSquare size={14} className={isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'} />
                                    <span className="text-xs truncate font-medium">
                                        {s.name || 'New Consultation'}
                                    </span>
                                </div>
                                <button 
                                    onClick={(e) => onDeleteSession?.(s.id, e)} 
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-all duration-200"
                                    title="Delete Consultation"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
