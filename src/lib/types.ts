

export type ViewState = 'home' | 'platform-select' | 'workspace';

export interface Category {
    id: string;
    name: string;
    description: string;
    icon?: any; // LucideIcon
    color?: string;
    link?: string; // For direct shortcut
    isCustom?: boolean;
}

export interface Platform {
    id: string;
    name: string;
    url: string;
    searchPattern: string; // URL pattern to append search query
    icon?: string; // Path to icon or keep simple
}

export interface ProblemData {
    id: string;
    notes: string;
    solution: string;
    title?: string;
    url?: string;
    description?: string;
    platformId?: string;
    timestamp?: number;
}
export interface TestResult {
    id: string;
    timestamp: number;
    score: number;
    total: number;
    durationSeconds: number;
}
