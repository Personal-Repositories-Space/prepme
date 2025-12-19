import React from 'react';
import { ProblemData } from './ProblemEditor';
import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';

interface ProblemListProps {
    problems: ProblemData[];
    onSelect: (id: string) => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({ problems, onSelect }) => {
    if (problems.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-zinc-400 mb-2">Your Directory</h3>
                <p className="text-sm max-w-xs mb-6">Problems you solve and save will appear here.</p>
                <div className="text-xs text-zinc-600 bg-zinc-900/50 px-3 py-2 rounded border border-zinc-800">
                    Tip: Enter a number above to start
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 px-1">Directory ({problems.length})</h2>
            {problems.map(p => (
                <button
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/30 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-zinc-700 transition-all group text-left"
                >
                    <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center text-sm font-mono font-bold text-zinc-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors border border-zinc-900 group-hover:border-indigo-500/20">
                        {p.id}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                            Problem {p.id}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                            {p.solution ? (
                                <span className="flex items-center gap-1 text-emerald-500/80"><CheckCircle2 className="w-3 h-3" /> Solved</span>
                            ) : (
                                <span>In Progress</span>
                            )}
                            {p.notes && <span className="text-zinc-600">• Notes added</span>}
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
                </button>
            ))}
        </div>
    );
};
