import React, { useState, useEffect } from 'react';
import { Category, Platform } from '../lib/types';
import { BookOpen, Server, Code2, Coffee, Layers, ChevronRight, Globe, Plus, Pencil, ExternalLink, Trash2, X } from 'lucide-react';


export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'revision', name: 'Revision', description: 'Review your saved problems', icon: BookOpen, color: 'text-yellow-400 bg-yellow-400/10' },
    { id: 'dsa', name: 'DSA', description: 'Data Structures & Algorithms', icon: Code2, color: 'text-indigo-400 bg-indigo-400/10' },
    { id: 'system-design', name: 'System Design', description: 'High Level & Low Level Design', icon: Server, color: 'text-purple-400 bg-purple-400/10' },
    { id: 'java', name: 'Java', description: 'Core Java & Frameworks', icon: Coffee, color: 'text-orange-400 bg-orange-400/10' },
    { id: 'others', name: 'Others', description: 'Behavioral, CS Fundamentals', icon: Layers, color: 'text-emerald-400 bg-emerald-400/10' },
];

export const PLATFORMS: Platform[] = [
    { id: 'leetcode', name: 'LeetCode', url: 'https://leetcode.com', searchPattern: 'https://leetcode.com/problemset/all/?search=' },
    { id: 'gfg', name: 'GeeksForGeeks', url: 'https://www.geeksforgeeks.org', searchPattern: 'https://www.geeksforgeeks.org/search/?q=' },
    { id: 'hackerrank', name: 'HackerRank', url: 'https://www.hackerrank.com/dashboard', searchPattern: 'https://www.hackerrank.com/dashboard' },
];

interface DashboardProps {
    view: 'home' | 'platform-select';
    onSelectCategory: (id: string, link?: string) => void;
    onSelectPlatform: (platform: Platform) => void;
    onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ view, onSelectCategory, onSelectPlatform, onBack }) => {
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', description: '', link: '' });

    // Load custom categories
    useEffect(() => {
        const saved = localStorage.getItem('custom_categories');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults (in case defaults change/update, keep defaults fresh but append customs)
            // Actually, easier to just treat the whole list as state, initialized from LS or Defaults.
            // If we want to allow editing defaults, we need to store EVERYTHING.
            // For now, let's assume we store the FULL list to allow reordering later maybe?
            // But simpler: Store only CUSTOM ones and append? 
            // Request said "Edit existing inputs". So we should store ALL if modified.
            // Strategy: Load "dashboard_state", if empty use DEFAULT.
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Re-attach icons for defaults if they are missing in JSON (JSON stringify strips functions/components)
                const restored = parsed.map((c: any) => {
                    const def = DEFAULT_CATEGORIES.find(d => d.id === c.id);
                    if (def) return { ...c, icon: def.icon }; // restore icon component
                    return { ...c, icon: Layers, isCustom: true }; // default icon for custom
                });
                setCategories(restored);
            }
        }
    }, []);

    const saveCategories = (newCats: Category[]) => {
        setCategories(newCats);
        // Strip icon components before saving
        const toSave = newCats.map(({ icon, ...rest }) => rest);
        localStorage.setItem('custom_categories', JSON.stringify(toSave));
    };

    const handleEdit = (e: React.MouseEvent, cat: Category) => {
        e.stopPropagation();
        setEditingId(cat.id);
        setFormData({
            name: cat.name,
            description: cat.description,
            link: cat.link || ''
        });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', link: '' });
        setShowModal(true);
    };

    const handleDelete = () => {
        if (!editingId) return;
        const newCats = categories.filter(c => c.id !== editingId);
        saveCategories(newCats);
        setShowModal(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            // Update existing
            const newCats = categories.map(c =>
                c.id === editingId
                    ? { ...c, ...formData }
                    : c
            );
            saveCategories(newCats);
        } else {
            // Create new
            const newCat: Category = {
                id: 'custom-' + Date.now(),
                ...formData,
                isCustom: true,
                icon: Layers, // Default icon
                color: 'text-pink-400 bg-pink-400/10'
            };
            saveCategories([...categories, newCat]);
        }
        setShowModal(false);
    };

    if (view === 'home') {
        return (
            <div className="flex-1 flex flex-col p-8 items-center justify-center animate-in fade-in zoom-in duration-300 relative">
                <div className="max-w-5xl w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-zinc-100">Welcome Back</h1>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Card
                        </button>
                    </div>
                    <p className="text-zinc-400 mb-8">Select a topic or shortcut to start.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categories.map(cat => {
                            const Icon = cat.icon || Layers;
                            return (
                                <div key={cat.id} className="group relative">
                                    <button
                                        onClick={() => onSelectCategory(cat.id, cat.link)}
                                        className="w-full h-full flex flex-col items-start p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all text-left"
                                    >
                                        <div className={`p-3 rounded-xl mb-4 ${cat.color || 'text-zinc-400 bg-zinc-800'} transition-transform group-hover:scale-105`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-zinc-200 mb-1 group-hover:text-white transition-colors flex items-center gap-2">
                                            {cat.name}
                                            {cat.link && <ExternalLink className="w-3 h-3 text-zinc-500" />}
                                        </h3>
                                        <p className="text-sm text-zinc-500 line-clamp-2">{cat.description}</p>
                                    </button>

                                    {/* Edit Button (Visible on Hover) */}
                                    <button
                                        onClick={(e) => handleEdit(e, cat)}
                                        className="absolute top-4 right-4 p-2 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-800 hover:border-zinc-600"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {editingId ? 'Edit Card' : 'New Card'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        placeholder="e.g. My Sheet"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                                        Direct Link (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        placeholder="https://..."
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">
                                        If provided, clicking this card will open the link directly.
                                    </p>
                                </div>

                                <div className="flex gap-3 mt-8 pt-4 border-t border-zinc-800">
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="flex-1"></div>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/25"
                                    >
                                        Save Card
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ... Platform Select Logic remains largely same ...
    return (
        <div className="flex-1 flex flex-col p-8 items-center justify-center animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="max-w-4xl w-full">
                <button onClick={onBack} className="text-sm text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1">
                    ← Back to Categories
                </button>
                <h1 className="text-3xl font-bold text-zinc-100 mb-2">Choose Platform</h1>
                <p className="text-zinc-400 mb-8">Where would you like to practice?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PLATFORMS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => onSelectPlatform(p)}
                            className="flex items-center gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all group text-left"
                        >
                            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 group-hover:border-indigo-500/30">
                                <Globe className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-white">{p.name}</h3>
                                <div className="text-xs text-zinc-500 flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                                    Open <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
