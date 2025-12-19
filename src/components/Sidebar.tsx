import React, { useState } from 'react';
import { ProblemEditor, ProblemData } from './ProblemEditor';
import { ProblemList } from './ProblemList';
import { Search, Database, ArrowLeft, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { Platform } from '../lib/types';

interface SidebarProps {
    activeId: string;
    query: string;
    data: ProblemData;
    history: ProblemData[];
    platform: Platform | null;
    onSearch: (e: React.FormEvent) => void;
    setQuery: (q: string) => void;
    setActiveId: (id: string) => void;
    onSelectProblem: (id: string) => void;
    onSave: (data: Partial<ProblemData>) => Promise<void>;
    onBackToHome: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeId, query, data, history, platform,
    onSearch, setQuery, setActiveId, onSelectProblem, onSave, onBackToHome
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>
            {/* Toggle Button (Floating when collapsed, or absolute on edge) */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "absolute z-50 top-4 transition-all duration-300 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white p-1.5 rounded-lg shadow-xl",
                    isCollapsed ? "left-4" : "left-[calc(40%-16px)]"
                )}
                title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div
                className={cn(
                    "flex flex-col border-r border-zinc-800 bg-zinc-900/30 transition-all duration-300 ease-in-out absolute h-full z-40",
                    isCollapsed ? "-translate-x-full w-[40%]" : "translate-x-0 w-[40%]"
                )}
            >
                {/* Header */}
                <div className="h-16 border-b border-zinc-800 flex items-center px-4 gap-3 bg-zinc-900/50 backdrop-blur-md">
                    <button
                        onClick={onBackToHome}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Back to Home"
                    >
                        <Home className="w-4 h-4" />
                    </button>

                    {activeId ? (
                        <button
                            onClick={() => { setActiveId(''); setQuery(''); }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Back to Directory"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-500/20">
                            <Database className="w-4 h-4" />
                        </div>
                    )}

                    <form onSubmit={onSearch} className="flex-1 relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={platform?.searchPattern ? `Search on ${platform.name}...` : "Problem #..."}
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-zinc-600"
                        />
                    </form>
                </div>

                {/* Content: Directory OR Editor */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900/80">
                    {activeId ? (
                        <ProblemEditor
                            key={activeId}
                            initialData={data}
                            onSave={onSave}
                        />
                    ) : (
                        <ProblemList
                            problems={history}
                            onSelect={onSelectProblem}
                        />
                    )}
                </div>
            </div>

            {/* Spacer to push content when not collapsed */}
            {!isCollapsed && <div className="w-[40%] flex-shrink-0" />}
        </>
    );
};
