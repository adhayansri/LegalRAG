import React from 'react'
import { Menu, Scale, Cpu, ShieldCheck, HelpCircle } from 'lucide-react'

export default function Navbar({ onToggleSidebar }) {
    return (
        <header className="sticky top-0 z-30 w-full bg-[#080d19]/80 backdrop-blur-md border-b border-white/[0.04] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle */}
                <button 
                    onClick={onToggleSidebar} 
                    className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                    <Menu size={18} />
                </button>

                <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-sky-400 md:hidden" />
                    <span className="text-sm font-bold tracking-wide text-white md:hidden">LEGALRAG</span>
                    
                    {/* Breadcrumbs or Status on desktop */}
                    <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <span className="text-slate-300">Workspace</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-300">Indian Law Library</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Engine Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/5 border border-sky-500/10 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                    <Cpu size={10} />
                    Gemini 2.5 Flash
                </div>
                
                {/* DB Connection Status */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck size={10} />
                    ChromaDB Ready
                </div>

                <a 
                    href="#" 
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="LegalRAG Help / Documentation"
                >
                    <HelpCircle size={16} />
                </a>
            </div>
        </header>
    )
}
