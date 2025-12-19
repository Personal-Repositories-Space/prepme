import React, { useState } from 'react';
import { ProblemData } from './ProblemEditor';
import { ArrowLeft, ExternalLink, CheckCircle, Brain, Code2, FileText, LayoutTemplate, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface StaticProblemViewerProps {
    data: ProblemData;
    onBack: () => void;
    onOpenInBrowser: () => void;
    onMarkReviewed: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

export const StaticProblemViewer: React.FC<StaticProblemViewerProps> = ({ data, onBack, onOpenInBrowser, onMarkReviewed }) => {
    const [activeTab, setActiveTab] = useState<'notes' | 'solution' | 'description'>('description');
    const [showReviewActions, setShowReviewActions] = useState(false);

    // If description is empty, default to notes
    React.useEffect(() => {
        if (!data.description && activeTab === 'description') {
            setActiveTab('notes');
        }
    }, [data.description]);

    const handleReviewClick = (difficulty: 'easy' | 'medium' | 'hard') => {
        onMarkReviewed(difficulty);
        // Maybe show an animation or toast?
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                            {data.title || 'Untitled Problem'}
                            {data.url && (
                                <button
                                    onClick={onOpenInBrowser}
                                    className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                                    title="Practice in Browser"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            )}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                            {data.platformId && <span className="capitalize">{data.platformId}</span>}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last Reviewed: {data.lastReviewed ? new Date(data.lastReviewed).toLocaleDateString() : 'Never'}
                            </span>
                            {data.box && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-indigo-400">
                                        <Brain className="w-3 h-3" /> Level {data.box}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!showReviewActions ? (
                        <button
                            onClick={() => setShowReviewActions(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Mark Reviewed
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            <span className="text-sm text-zinc-400 mr-2">How was it?</span>
                            <button onClick={() => handleReviewClick('easy')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-md text-sm font-medium">Easy</button>
                            <button onClick={() => handleReviewClick('medium')} className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 rounded-md text-sm font-medium">Medium</button>
                            <button onClick={() => handleReviewClick('hard')} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-md text-sm font-medium">Hard</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Tabs Sidebar (Desktop) / Topbar (Mobile) */}
                <div className="flex md:flex-col border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/30">
                    {data.description && (
                        <button
                            onClick={() => setActiveTab('description')}
                            className={cn(
                                "flex items-center gap-3 px-6 py-4 text-sm font-medium border-l-2 transition-all hover:bg-zinc-800/50 text-left",
                                activeTab === 'description'
                                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            <span className="hidden md:inline">Description</span>
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={cn(
                            "flex items-center gap-3 px-6 py-4 text-sm font-medium border-l-2 transition-all hover:bg-zinc-800/50 text-left",
                            activeTab === 'notes'
                                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden md:inline">My Notes</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('solution')}
                        className={cn(
                            "flex items-center gap-3 px-6 py-4 text-sm font-medium border-l-2 transition-all hover:bg-zinc-800/50 text-left",
                            activeTab === 'solution'
                                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Code2 className="w-4 h-4" />
                        <span className="hidden md:inline">My Solution</span>
                    </button>
                </div>

                {/* Pane Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-zinc-950">
                    <div className="max-w-4xl mx-auto">
                        {activeTab === 'description' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                                    <LayoutTemplate className="w-5 h-5 text-zinc-500" /> Problem Description
                                </h2>
                                <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50">
                                    {data.description}
                                </div>
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-zinc-500" /> My Notes
                                </h2>
                                {data.notes ? (
                                    <div className="prose prose-invert prose-indigo max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50 min-h-[200px]">
                                        {data.notes}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                                        <FileText className="w-10 h-10 mb-4 opacity-50" />
                                        <p>No notes written yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'solution' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                                    <Code2 className="w-5 h-5 text-zinc-500" /> Solution Code
                                </h2>
                                {data.solution ? (
                                    <pre className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 overflow-x-auto text-sm font-mono text-zinc-300">
                                        <code>{data.solution}</code>
                                    </pre>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                                        <Code2 className="w-10 h-10 mb-4 opacity-50" />
                                        <p>No solution saved yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
