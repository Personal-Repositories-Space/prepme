import React, { useState, useEffect } from 'react';
import { ProblemData } from './ProblemEditor';
import { Timer, CheckCircle, XCircle, Play, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming you have this util

interface TestModeProps {
    problems: ProblemData[];
    onBack: () => void;
    onComplete: (score: number, total: number) => void;
}

export const TestMode: React.FC<TestModeProps> = ({ problems, onBack }) => {
    // Config Stage
    const [status, setStatus] = useState<'config' | 'running' | 'results'>('config');
    const [config, setConfig] = useState({ count: 5, durationMinutes: 30 });

    // Running Stage
    const [testQuestions, setTestQuestions] = useState<ProblemData[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showSolution, setShowSolution] = useState(false);

    // Results
    // Map of questionId -> 'pass' | 'fail' | 'skipped'
    const [results, setResults] = useState<Record<string, 'pass' | 'fail' | 'skipped'>>({});

    const finishTest = async (finalResults?: Record<string, 'pass' | 'fail' | 'skipped'>) => {
        setStatus('results');
        const resultsToUse = finalResults || results;
        const score = Object.values(resultsToUse).filter(r => r === 'pass').length;

        const result = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            score,
            total: testQuestions.length,
            durationSeconds: (config.durationMinutes * 60) - timeLeft
        };

        try {
            // @ts-ignore
            await window.ipcRenderer.invoke('save-test-result', result);
            console.log("Test result saved");
        } catch (e) {
            console.error("Failed to save test result", e);
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === 'running' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        finishTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    const startTest = () => {
        // Randomly select N problems
        const shuffled = [...problems].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, config.count);

        if (selected.length === 0) {
            alert("No problems available for test!"); // Should use toast
            return;
        }

        setTestQuestions(selected);
        setCurrentQuestionIndex(0);
        setTimeLeft(config.durationMinutes * 60);
        setResults({});
        setStatus('running');
    };

    const handleResult = (result: 'pass' | 'fail') => {
        const q = testQuestions[currentQuestionIndex];
        const newResults = { ...results, [q.id]: result };
        setResults(newResults);

        if (currentQuestionIndex < testQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setShowSolution(false);
        } else {
            finishTest(newResults);
        }
    };

    // calculate score for results
    const score = Object.values(results).filter(r => r === 'pass').length;

    // --- RENDER ---

    if (status === 'config') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-8 animate-in zoom-in-95 duration-300">
                <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    <button onClick={onBack} className="mb-6 text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back to Hub
                    </button>
                    <h1 className="text-2xl font-bold mb-2">Mock Test Setup</h1>
                    <p className="text-zinc-400 mb-8 text-sm">Challenge yourself with a timed random selection of problems.</p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Number of Questions</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[5, 10, 20].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setConfig({ ...config, count: num })}
                                        className={cn(
                                            "py-2 rounded-lg text-sm font-medium border transition-all",
                                            config.count === num
                                                ? "bg-indigo-600 border-indigo-500 text-white"
                                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                        )}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Duration (Minutes)</label>
                            <input
                                type="range"
                                min="5"
                                max="120"
                                step="5"
                                value={config.durationMinutes}
                                onChange={(e) => setConfig({ ...config, durationMinutes: parseInt(e.target.value) })}
                                className="w-full accent-indigo-500"
                            />
                            <div className="text-right text-indigo-400 font-mono mt-1">{config.durationMinutes} min</div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <button
                                onClick={startTest}
                                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                            >
                                <Play className="w-5 h-5 fill-current" /> Start Test
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'results') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-8 animate-in zoom-in-95 duration-300">
                <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">Test Complete!</h1>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400 my-8">
                        {Math.round((score / testQuestions.length) * 100)}%
                    </div>
                    <p className="text-zinc-400 mb-8">
                        You answered {score} out of {testQuestions.length} correctly.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <button onClick={onBack} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200">
                            Back to Hub
                        </button>
                        <button onClick={() => setStatus('config')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white">
                            New Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // RUNNING
    const currentQ = testQuestions[currentQuestionIndex];
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-4">
                    <span className="font-mono text-xl text-zinc-400">
                        {currentQuestionIndex + 1} / <span className="text-zinc-600">{testQuestions.length}</span>
                    </span>
                    <h2 className="font-medium text-zinc-200 max-w-xl truncate">{currentQ.title}</h2>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
                    <Timer className={cn("w-4 h-4", timeLeft < 60 ? "text-red-500 animate-pulse" : "text-indigo-400")} />
                    <span className="font-mono font-bold w-12 text-center">{formatTime(timeLeft)}</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-8 overflow-y-auto">
                {/* Question Card */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-8">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Problem Description</h3>
                    {currentQ.description ? (
                        <div className="prose prose-invert max-w-none text-zinc-300">
                            <p className="whitespace-pre-wrap">{currentQ.description}</p>
                        </div>
                    ) : (
                        <p className="text-zinc-500 italic">No description available. Check the URL if needed.</p>
                    )}
                </div>

                {/* Solution Reveal */}
                {!showSolution ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                        <BrainIcon className="w-12 h-12 text-zinc-600 mb-4" />
                        <p className="text-zinc-400 mb-6">Think about the solution. When ready, verify.</p>
                        <button
                            onClick={() => setShowSolution(true)}
                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium border border-zinc-700"
                        >
                            Reveal Solution
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-300">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Your Saved Solution</h3>
                            <pre className="font-mono text-sm text-zinc-300 overflow-x-auto">
                                <code>{currentQ.solution || '// No solution saved.'}</code>
                            </pre>
                        </div>

                        <div className="flex flex-col items-center gap-4 p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <p className="text-lg font-medium text-zinc-200">How did you do?</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleResult('fail')}
                                    className="flex items-center gap-2 px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors font-medium"
                                >
                                    <XCircle className="w-5 h-5" /> Incorrect
                                </button>
                                <button
                                    onClick={() => handleResult('pass')}
                                    className="flex items-center gap-2 px-8 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-colors font-medium"
                                >
                                    <CheckCircle className="w-5 h-5" /> Correct
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple icon for placeholder
const BrainIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
        <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
        <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
        <path d="M6 18a4 4 0 0 1-1.97-3.484" />
        <path d="M18 18a4 4 0 0 0 1.97-3.484" />
    </svg>
)
