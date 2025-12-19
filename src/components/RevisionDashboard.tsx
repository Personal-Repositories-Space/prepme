import React, { useMemo, useState, useEffect } from 'react';
import { ProblemData } from './ProblemEditor';
import { Calendar, CheckCircle2, TrendingUp, Brain, ChevronRight, Target, BarChart2, Filter, Flame, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TestResult } from '../lib/types';
import { cn } from '../lib/utils';

interface RevisionDashboardProps {
    problems: ProblemData[];
    onSelectProblem: (id: string, action: 'review' | 'browser') => void;
    onStartTest: () => void;
}

export const RevisionDashboard: React.FC<RevisionDashboardProps> = ({ problems, onSelectProblem, onStartTest }) => {

    // Test History State
    const [testHistory, setTestHistory] = useState<TestResult[]>([]);

    // Filter State
    type FilterType = 'all' | 'due' | 'reviewed' | 'mastered';
    const [activeFilter, setActiveFilter] = useState<FilterType>('due');

    // Load History
    useEffect(() => {
        const load = async () => {
            try {
                // @ts-ignore
                const res = await window.ipcRenderer.invoke('get-test-results');
                if (Array.isArray(res)) setTestHistory(res);
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    // Derived Data & Stats
    const stats = useMemo(() => {
        const now = Date.now();
        const todayStr = new Date().toDateString();

        const reviewedToday = problems.filter(p => p.lastReviewed && new Date(p.lastReviewed).toDateString() === todayStr);
        const mastered = problems.filter(p => (p.box || 0) > 3);
        const due = problems.filter(p => !p.nextReviewDate || p.nextReviewDate <= now);

        return { reviewedToday, mastered, due };
    }, [problems]);

    // Streak Logic
    const streakData = useMemo(() => {
        // Collect all unique activity dates (YYYY-MM-DD)
        const activityDates = new Set<string>();

        // 1. Problem Created / Updated
        problems.forEach(p => {
            if (p.timestamp) activityDates.add(new Date(p.timestamp).toDateString());
            if (p.lastReviewed) activityDates.add(new Date(p.lastReviewed).toDateString());
            if (p.lastUpdated) activityDates.add(new Date(p.lastUpdated).toDateString());
        });

        // 2. Tests Taken
        testHistory.forEach(t => {
            if (t.timestamp) activityDates.add(new Date(t.timestamp).toDateString());
        });

        // Iterate to find consecutive days
        // simplified logic:
        let streak = 0;
        let d = new Date();
        const yStr = new Date(Date.now() - 86400000).toDateString();
        const tStr = new Date().toDateString();

        if (activityDates.has(tStr)) {
            streak = 1;
            d.setDate(d.getDate() - 1);
        } else if (activityDates.has(yStr)) {
            streak = 0; // Will start counting from yesterday in loop
        } else {
            return { current: 0, activityMap: activityDates };
        }

        while (true) {
            if (activityDates.has(d.toDateString())) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }

        return { current: streak, activityMap: activityDates };

    }, [problems, testHistory]);

    // Heatmap Generation
    const heatmapDays = useMemo(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const str = d.toDateString();
            days.push({
                date: d,
                active: streakData.activityMap.has(str),
                isToday: i === 0
            });
        }
        return days;
    }, [streakData]);

    const filteredProblems = useMemo(() => {
        switch (activeFilter) {
            case 'due': return stats.due;
            case 'reviewed': return stats.reviewedToday;
            case 'mastered': return stats.mastered;
            default: return problems;
        }
    }, [activeFilter, stats, problems]);

    // Chart Data
    const chartData = useMemo(() => {
        return testHistory.slice(-10).map((t, i) => ({
            name: `Test ${i + 1}`,
            score: Math.round((t.score / t.total) * 100),
            date: new Date(t.timestamp).toLocaleDateString()
        }));
    }, [testHistory]);

    return (
        <div className="flex-1 flex flex-col p-8 items-center bg-zinc-950 text-zinc-100 overflow-y-auto w-full">
            <div className="max-w-6xl w-full">

                {/* Header with Streak */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                Revision Hub
                            </h1>
                            <p className="text-zinc-400 mt-1">Keep your skills sharp with spaced repetition.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-3 px-5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Current Streak</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-xl font-mono font-bold", streakData.current > 0 ? "text-orange-500" : "text-zinc-600")}>
                                        {streakData.current}
                                    </span>
                                    <Flame className={cn("w-5 h-5", streakData.current > 0 ? "text-orange-500 fill-orange-500/20" : "text-zinc-700")} />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onStartTest}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-lg shadow-indigo-500/10"
                        >
                            <Target className="w-5 h-5" /> Mock Test
                        </button>
                    </div>
                </div>

                {/* Heatmap & Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* Activity Heatmap & Interactive Filter Cards (Left 2/3) */}
                    <div className="lg:col-span-2 flex flex-col gap-8">

                        {/* Heatmap Bar */}
                        <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between overflow-x-auto">
                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mr-4">
                                <Activity className="w-4 h-4" /> 30 Day Activity
                            </div>
                            <div className="flex gap-1">
                                {heatmapDays.map((d, i) => (
                                    <div
                                        key={i}
                                        title={d.date.toLocaleDateString()}
                                        className={cn(
                                            "w-3 h-8 rounded-sm transition-all hover:scale-110",
                                            d.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-800/50",
                                            d.isToday && "ring-1 ring-white"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Interactive Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setActiveFilter('reviewed')}
                                className={cn(
                                    "p-6 rounded-2xl border text-left transition-all relative overflow-hidden group",
                                    activeFilter === 'reviewed' ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50" : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900"
                                )}
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <span className="text-zinc-500 text-sm font-medium">Reviewed Today</span>
                                </div>
                                <h3 className="text-3xl font-bold text-zinc-200 ml-1">{stats.reviewedToday.length}</h3>
                                {activeFilter === 'reviewed' && <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />}
                            </button>

                            <button
                                onClick={() => setActiveFilter('mastered')}
                                className={cn(
                                    "p-6 rounded-2xl border text-left transition-all relative overflow-hidden group",
                                    activeFilter === 'mastered' ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50" : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900"
                                )}
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <span className="text-zinc-500 text-sm font-medium">Mastered</span>
                                </div>
                                <h3 className="text-3xl font-bold text-zinc-200 ml-1">{stats.mastered.length}</h3>
                            </button>

                            <button
                                onClick={() => setActiveFilter('due')}
                                className={cn(
                                    "p-6 rounded-2xl border text-left transition-all relative overflow-hidden group",
                                    activeFilter === 'due' ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500/50" : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900"
                                )}
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <span className="text-zinc-500 text-sm font-medium">Due Now</span>
                                </div>
                                <h3 className="text-3xl font-bold text-zinc-200 ml-1">{stats.due.length}</h3>
                                {stats.due.length > 0 && <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span></span>}
                            </button>
                        </div>
                    </div>

                    {/* Performance Chart (Right 1/3) */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Performance Trend
                        </h3>
                        {chartData.length > 1 ? (
                            <div className="flex-1 min-h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <XAxis dataKey="name" hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#818cf8' }}
                                            labelStyle={{ display: 'none' }}
                                            formatter={(value: any) => [`${value}%`, 'Score']}
                                        />
                                        <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#818cf8' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                                <BarChart2 className="w-10 h-10 mb-2 opacity-50" />
                                <p className="text-xs">Take 2+ tests to see trend</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filtered Problem List */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-zinc-200 flex items-center gap-2 capitalize">
                            <Filter className="w-5 h-5 text-zinc-500" />
                            {activeFilter === 'all' ? 'All Problems' : activeFilter === 'reviewed' ? 'Reviewed Today' : activeFilter === 'mastered' ? 'Mastered Problems' : 'Due for Review'}
                            <span className="ml-2 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full font-mono">
                                {filteredProblems.length}
                            </span>
                        </h2>

                        {/* Clear Filter Button */}
                        {activeFilter !== 'all' && (
                            <button onClick={() => setActiveFilter('all')} className="text-xs text-zinc-500 hover:text-indigo-400 underline">
                                Show All Problems
                            </button>
                        )}
                    </div>

                    {filteredProblems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-2 duration-300">
                            {filteredProblems.slice(0, 12).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelectProblem(p.id, 'review')}
                                    className="flex flex-col items-start p-5 bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800/60 rounded-xl text-left transition-all group"
                                >
                                    <div className="flex items-center justify-between w-full mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider ${(p.box || 1) >= 4 ? 'bg-emerald-500/10 text-emerald-400' :
                                            (p.box || 1) >= 2 ? 'bg-yellow-500/10 text-yellow-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                            Level {p.box || 1}
                                        </span>
                                        {p.platformId && (
                                            <span className="text-[10px] text-zinc-600 uppercase">{p.platformId}</span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-zinc-200 group-hover:text-white line-clamp-1 mb-1">
                                        {p.title || `Problem ${p.id}`}
                                    </h3>
                                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                                        {p.description || "No description available."}
                                    </p>

                                    <div className="mt-auto w-full flex items-center justify-between text-xs font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Review Now <ChevronRight className="w-3 h-3" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                            <CheckCircle2 className="w-12 h-12 text-zinc-700 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-zinc-400">Nothing here yet</h3>
                            <p className="text-zinc-600">Try changing filters or adding more problems.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
