import React, { useState, useEffect, useRef } from 'react';
import { BrowserView, BrowserViewRef } from './components/BrowserView';
import { ProblemData } from './components/ProblemEditor';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import { FloatingControls } from './components/FloatingControls';
import { FloatingNote } from './components/FloatingNote';
import { RevisionDashboard } from './components/RevisionDashboard';
import { StaticProblemViewer } from './components/StaticProblemViewer';
import { TestMode } from './components/TestMode';
import { Platform, ViewState } from './lib/types';

// Updated ViewState type
type ExtendedViewState = ViewState | 'revision-hub' | 'static-viewer' | 'test-mode';

function App() {
  // State
  const [view, setView] = useState<ExtendedViewState>('home');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_category, setCategory] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);

  const [url, setUrl] = useState('about:blank');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>('');
  const [data, setData] = useState<ProblemData>({ id: '', notes: '', solution: '' });
  const [history, setHistory] = useState<ProblemData[]>([]);

  // Floating State
  const [showFloatingNote, setShowFloatingNote] = useState(false);

  // Refs
  const browserRef = useRef<BrowserViewRef>(null);

  // Load history
  useEffect(() => {
    refreshHistory();
  }, []);

  const refreshHistory = async () => {
    try {
      // @ts-ignore
      const list = await window.ipcRenderer.invoke('list-problems');
      console.log('refreshHistory list:', list);
      if (list && Array.isArray(list)) {
        list.sort((a, b) => parseInt(a.id) - parseInt(b.id) || a.id.localeCompare(b.id));
        setHistory(list);
      }
    } catch (e) {
      console.error("Failed to list problems", e);
    }
  };

  // Load problem data
  useEffect(() => {
    if (!activeId) return;

    const load = async () => {
      try {
        // @ts-ignore
        const result = await window.ipcRenderer.invoke('load-problem', activeId);
        if (result) {
          setData(result);
        } else {
          setData({ id: activeId, notes: '', solution: '' });
        }
      } catch (e) {
        setData({ id: activeId, notes: '', solution: '' });
      }
    };
    load();
  }, [activeId]);

  // Handlers
  const handleCategorySelect = (id: string, link?: string) => {
    if (link) {
      setCategory(id);
      setUrl(link);
      setPlatform(null);
      setView('workspace');
      return;
    }

    // Generic Revision Mode -> Now Revision HUB
    if (id === 'revision') {
      setView('revision-hub');
      setCategory(id);
      return;
    }

    setCategory(id);
    setView('platform-select');
  };

  const handlePlatformSelect = (p: Platform) => {
    setPlatform(p);
    setUrl(p.url);
    setView('workspace');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const id = query.trim();
      setActiveId(id);
      if (platform?.searchPattern) {
        setUrl(`${platform.searchPattern}${id}`);
      }
    }
  };

  const handleSelectProblem = (id: string) => {
    setActiveId(id);
    setQuery(id);
    if (platform?.searchPattern) {
      setUrl(`${platform.searchPattern}${id}`);
    } else {
      const problem = history.find(p => p.id === id);
      if (problem?.url) {
        setUrl(problem.url);
      }
    }
  };

  const handleSave = async (updatedData: Partial<ProblemData>) => {
    console.log("handleSave:", updatedData);
    if (!activeId && !updatedData.id) return;
    const targetId = activeId || updatedData.id || 'unknown';

    const fullData = {
      ...data,
      ...updatedData,
      id: targetId,
      lastUpdated: Date.now() // Always track activity on save
    };
    setData(fullData);
    // @ts-ignore
    const res = await window.ipcRenderer.invoke('save-problem', fullData);
    console.log("save-problem result:", res);
    await refreshHistory();
    // Use the ID if we just created one
    if (!activeId) {
      setActiveId(targetId);
      setQuery(targetId);
    }
  };

  const resetToHome = () => {
    setView('home');
    setCategory(null);
    setPlatform(null);
    setActiveId('');
    setQuery('');
    setUrl('about:blank');
  };

  // SRS Logic
  const handleMarkReviewed = async (difficulty: 'easy' | 'medium' | 'hard') => {
    // Leitner System Logic
    const currentBox = data.box || 1;
    let nextBox = currentBox;
    let intervalDays = 1;

    if (difficulty === 'easy') nextBox = Math.min(currentBox + 1, 5);
    else if (difficulty === 'medium') nextBox = currentBox;
    else nextBox = 1; // Reset if hard

    switch (nextBox) {
      case 1: intervalDays = 1; break;
      case 2: intervalDays = 3; break;
      case 3: intervalDays = 7; break;
      case 4: intervalDays = 14; break;
      case 5: intervalDays = 30; break;
    }

    const nextDate = Date.now() + (intervalDays * 24 * 60 * 60 * 1000);

    const update = {
      box: nextBox,
      lastReviewed: Date.now(),
      nextReviewDate: nextDate,
      difficulty
    };

    await handleSave(update);
    // Go back to hub after reviewing
    setView('revision-hub');
  };

  const scrapeAndSave = async (openNote: boolean = false) => {
    if (!browserRef.current) return;
    const details = await browserRef.current.getPageDetails();
    if (!details.url) return;

    let targetId = activeId;

    // Check if this URL is already saved in history
    const existing = history.find(p => p.url === details.url);

    if (existing) {
      // We are on a known page, switch to it
      targetId = existing.id;
      if (targetId !== activeId) {
        setActiveId(targetId);
        setQuery(targetId);
      }
    } else {
      // New URL? Check if we are currently editing a valid problem with a DIFFERENT URL
      // If so, we must be creating a NEW problem
      const isNewPage = !data.url || data.url !== details.url;

      if (isNewPage) {
        const parts = details.url.split('/').filter(p => p);
        let slug = parts[parts.length - 1] || 'page-' + Date.now();
        // Remove query params
        if (slug.includes('?')) slug = slug.split('?')[0];

        // Ensure uniqueness
        let potentialId = slug;
        let counter = 1;
        while (history.some(p => p.id === potentialId)) {
          potentialId = `${slug}-${counter}`;
          counter++;
        }

        targetId = potentialId;
        // Don't switch yet, wait for save to complete
      }
    }

    const newData: Partial<ProblemData> = {
      id: targetId, // Ensure we save to the correct target
      title: details.title,
      url: details.url,
      description: details.description,
      platformId: platform?.id || 'manual'
    };

    // Preserve existing creation timestamp if updating, else add new
    if (!existing) {
      newData.timestamp = Date.now();
      // Reset fields for new problem to avoid inheriting from current state
      newData.notes = '';
      newData.solution = '';
      newData.box = 1;
    }

    await handleSave(newData);

    // Switch to new problem safely now that it exists on disk
    if (targetId !== activeId) {
      setActiveId(targetId);
      setQuery(targetId);
    }

    if (openNote) setShowFloatingNote(true);
  };

  // --- Views ---

  // 1. Revision Hub
  if (view === 'revision-hub') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col">
        {/* Simple Top Nav for Hub */}
        <div className="flex items-center p-4 border-b border-zinc-800 bg-zinc-900">
          <button onClick={resetToHome} className="text-zinc-500 hover:text-zinc-300 mr-4">Home</button>
          <span className="text-zinc-700">/</span>
          <span className="ml-4 font-semibold text-zinc-200">Revision Hub</span>
        </div>
        <RevisionDashboard
          problems={history}
          onSelectProblem={(id, action) => {
            setActiveId(id);
            if (action === 'review') setView('static-viewer');
            else {
              // open in browser
              const p = history.find(x => x.id === id);
              if (p?.url) setUrl(p.url);
              setView('workspace');
            }
          }}
          onStartTest={() => setView('test-mode')}
        />
      </div>
    );
  }

  // 2. Static Viewer (Offline Review)
  if (view === 'static-viewer') {
    return (
      <div className="h-screen w-screen bg-zinc-950">
        <StaticProblemViewer
          data={data}
          onBack={() => setView('revision-hub')}
          onOpenInBrowser={() => {
            if (data.url) setUrl(data.url);
            setView('workspace');
          }}
          onMarkReviewed={handleMarkReviewed}
        />
      </div>
    );
  }

  // 3. Test Mode
  if (view === 'test-mode') {
    return (
      <div className="h-screen w-screen bg-zinc-950">
        <TestMode
          problems={history}
          onBack={() => setView('revision-hub')}
          onComplete={() => { }}
        />
      </div>
    );
  }

  // 4. Dashboard (Home / Platform Select)
  if (view !== 'workspace') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col">
        <Dashboard
          view={view === 'home' ? 'home' : 'platform-select'}
          onSelectCategory={handleCategorySelect}
          onSelectPlatform={handlePlatformSelect}
          onBack={() => setView('home')}
        />
      </div>
    );
  }

  // 5. Workspace (Existing)
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans relative">
      <Sidebar
        activeId={activeId}
        query={query}
        data={data}
        history={history}
        platform={platform}
        onSearch={handleSearch}
        setQuery={setQuery}
        setActiveId={setActiveId}
        onSelectProblem={handleSelectProblem}
        onSave={handleSave}
        onBackToHome={resetToHome}
      />

      <div className="flex-1 h-full bg-black relative">
        <BrowserView
          ref={browserRef}
          url={url}
        />
        <FloatingControls
          onAdd={() => scrapeAndSave(false)}
          onNote={() => scrapeAndSave(true)}
        />
        {showFloatingNote && (
          <FloatingNote
            data={data}
            onClose={() => setShowFloatingNote(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}

export default App;
