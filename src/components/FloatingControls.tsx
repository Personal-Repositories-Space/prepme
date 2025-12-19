import React, { useState } from 'react';
import { Plus, StickyNote, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

interface FloatingControlsProps {
    onAdd: () => void;
    onNote: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({ onAdd, onNote }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="absolute bottom-8 right-8 flex flex-col items-end gap-3 z-50 group"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Expanded Options */}
            <div className={cn(
                "flex flex-col gap-3 transition-all duration-300 origin-bottom",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
            )}>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-white px-2 py-1 bg-black/50 rounded backdrop-blur">
                        Open Note
                    </span>
                    <button
                        onClick={onNote}
                        className="w-12 h-12 rounded-full bg-zinc-800 text-purple-400 hover:text-white hover:bg-purple-600 shadow-lg flex items-center justify-center border border-zinc-700 transition-colors"
                    >
                        <StickyNote className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-white px-2 py-1 bg-black/50 rounded backdrop-blur">
                        Capture Page
                    </span>
                    <button
                        onClick={onAdd}
                        className="w-12 h-12 rounded-full bg-zinc-800 text-emerald-400 hover:text-white hover:bg-emerald-600 shadow-lg flex items-center justify-center border border-zinc-700 transition-colors"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Toggle Button */}
            <button
                // onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center transition-all bg-indigo-600 hover:bg-indigo-500 text-white",
                    isOpen ? "rotate-45 bg-zinc-700 hover:bg-zinc-600" : ""
                )}
            >
                <Plus className="w-8 h-8 transition-transform" />
            </button>
        </div>
    );
};
