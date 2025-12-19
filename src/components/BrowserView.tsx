import { forwardRef, useImperativeHandle, useRef } from 'react';

interface BrowserViewProps {
    url: string;
}

export interface BrowserViewRef {
    getPageDetails: () => Promise<{ title: string; url: string; description: string; }>;
}

export const BrowserView = forwardRef<BrowserViewRef, BrowserViewProps>(({ url }, ref) => {
    const webviewRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        getPageDetails: async () => {
            if (!webviewRef.current) return { title: '', url: '', description: '' };

            try {
                const title = webviewRef.current.getTitle();
                const currentUrl = webviewRef.current.getURL();

                // Execute JS to get meta description
                const description = await webviewRef.current.executeJavaScript(`
                    document.querySelector('meta[name="description"]')?.content || ''
                `);

                return { title, url: currentUrl, description };
            } catch (e) {
                console.error("Failed to scrape page", e);
                return { title: 'Unknown', url: url, description: '' };
            }
        }
    }));

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-zinc-900 border-l border-zinc-700 overflow-hidden relative">
            <webview
                ref={webviewRef}
                src={url}
                className="flex-1 w-full h-full"
                allowpopups={true}
                partition="persist:leetcode"
            />
        </div>
    );
});
