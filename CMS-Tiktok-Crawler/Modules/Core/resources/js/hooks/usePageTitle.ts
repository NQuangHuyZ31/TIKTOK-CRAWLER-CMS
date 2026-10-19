import { useEffect } from 'react';

export function usePageTitle(title: string, prefix = 'CMS TikTok Crawler'): void {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title ? `${title} | ${prefix}` : prefix;

        return () => {
            document.title = previousTitle;
        };
    }, [title, prefix]);
}
