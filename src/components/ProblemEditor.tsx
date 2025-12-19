import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { PenSquare, Code2, Save, Loader2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

export interface ProblemData {
    id: string;
    notes: string;
    solution: string;
    title?: string;
    url?: string;
    description?: string;
    platformId?: string;
    timestamp?: number;
    lastUpdated?: number;
    // Spaced Repetition fields
    box?: number; // Leitner box (1-5)
    lastReviewed?: number;
    nextReviewDate?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
}

interface ProblemEditorProps {
    initialData: ProblemData;
    onSave: (data: Partial<ProblemData>) => Promise<void>;
}

export const ProblemEditor: React.FC<ProblemEditorProps> = ({ initialData, onSave }) => {
    const [activeTab, setActiveTab] = useState<'notes' | 'solution'>('notes');
    const [showDetails, setShowDetails] = useState(true);
    const [notes, setNotes] = useState(initialData.notes || '');
    const [solution, setSolution] = useState(initialData.solution || '');
    const [isSaving, setIsSaving] = useState(false);

    // Update local state if initialData changes (e.g. loaded new problem)
    useEffect(() => {
        setNotes(initialData.notes || '');
        setSolution(initialData.solution || '');
        // Auto-expand details if we have content but no notes yet
        if (initialData.description && !initialData.notes) {
            setShowDetails(true);
        }
    }, [initialData]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({ notes, solution });
        } finally {
            // minimal delay to show spinner
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950/50">
            {/* Top Bar: Controls */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-zinc-100/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    >
                        {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Problem Details
                    </button>
                    {initialData.url && (
                        <a
                            href={initialData.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-2"
                        >
                            <ExternalLink className="w-3 h-3" /> Open
                        </a>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isSaving && <span className="text-xs text-indigo-400 animate-pulse">Saving...</span>}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
                        title="Save (Cmd+S)"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Question Details Panel (Collapsible) */}
            {initialData.id && showDetails && (
                <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-in slide-in-from-top-2 duration-200 shadow-sm max-h-[40%] overflow-y-auto">
                    <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                        {initialData.title || `Problem ${initialData.id}`}
                    </h1>
                    {initialData.description ? (
                        <div className="prose dark:prose-invert prose-sm max-w-none text-zinc-600 dark:text-zinc-300">
                            {/* Simple rendering of description. If html/markdown, might need renderer */}
                            <p className="whitespace-pre-wrap">{initialData.description}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 italic">No description captured.</p>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-4 bg-zinc-50 dark:bg-zinc-950">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'notes'
                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                >
                    <PenSquare className="w-4 h-4" /> Notes
                </button>
                <button
                    onClick={() => setActiveTab('solution')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'solution'
                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                >
                    <Code2 className="w-4 h-4" /> Solution
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-4 relative bg-zinc-50 dark:bg-zinc-950/30">
                {activeTab === 'notes' && (
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full h-full bg-transparent resize-none outline-none font-sans text-sm text-zinc-800 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 leading-relaxed p-2"
                        placeholder="Write your observations, approach, and key takeaways here..."
                    />
                )}
                {activeTab === 'solution' && (
                    <textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        className="w-full h-full bg-transparent resize-none outline-none font-mono text-sm text-zinc-800 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 p-2"
                        placeholder="// Paste your efficient solution here..."
                        spellCheck={false}
                    />
                )}
            </div>
        </div>
    );
};
