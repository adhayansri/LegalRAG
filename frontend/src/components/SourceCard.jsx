import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'

export default function SourceCard({ source }) {
    const [open, setOpen] = useState(false)
    return (
        <motion.div 
            initial={{ opacity: 0, y: 6 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/[0.03] hover:border-white/[0.06] p-3 transition-colors duration-200"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="mt-0.5 p-1 rounded bg-sky-500/5 text-sky-400">
                        <Scale size={12} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                            <span>{source.act}</span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-semibold">
                                Sec {source.section}
                            </span>
                        </div>
                        {source.title && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                                {source.title}
                            </div>
                        )}
                    </div>
                </div>
                
                <button 
                    onClick={() => setOpen(o => !o)} 
                    className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2.5 pt-2.5 border-t border-white/[0.03] text-[11px] text-slate-400 leading-relaxed font-sans whitespace-pre-wrap select-all bg-black/15 p-2 rounded-lg">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-sky-500 uppercase tracking-wide mb-1.5">
                                <BookOpen size={9} />
                                Document Snippet
                            </div>
                            {source.snippet}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
