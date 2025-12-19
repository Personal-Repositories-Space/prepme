import React, { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { ProblemData } from '../lib/types';

interface FloatingNoteProps {
    data: ProblemData;
    onClose: () => void;
    onSave: (data: Partial<ProblemData>) => void;
}

export const FloatingNote: React.FC<FloatingNoteProps> = ({ data, onClose, onSave }) => {
    const [notes, setNotes] = useState(data.notes || '');
    // Initial position: center-right
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        setNotes(data.notes || '');
    }, [data.id]); // Update if ID changes

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Auto-save on unmount or close is good, but explicit save on change or blur is better.
    // We'll save on blur of textarea.
    const handleBlur = () => {
        onSave({ notes });
    };

    return (
        <div
            className="fixed z-[60] w-96 h-[400px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden resize-y min-h-[200px] max-h-[80vh]"
            style={{
                left: position.x,
                top: position.y,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Header / Drag Handle */}
            <div
                className="h-10 bg-zinc-800 border-b border-zinc-700 flex items-center px-3 cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <GripHorizontal className="w-4 h-4 text-zinc-500 mr-2" />
                <span className="text-sm font-medium text-zinc-300 flex-1 truncate">
                    Notes: {data.id}
                </span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 bg-zinc-900/90 backdrop-blur-sm">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleBlur}
                    className="w-full h-full bg-transparent resize-none outline-none font-sans text-sm text-zinc-200 placeholder:text-zinc-600"
                    placeholder="Quick notes..."
                    autoFocus
                />
            </div>

            {/* Footer / Status */}
            <div className="h-6 bg-zinc-950/50 flex items-center justify-end px-3 border-t border-zinc-800 text-[10px] text-zinc-600">
                Auto-saves on blur
            </div>
        </div>
    );
};
