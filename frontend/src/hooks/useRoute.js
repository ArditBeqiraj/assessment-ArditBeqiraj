import { useCallback, useEffect, useState } from 'react';
import { createRouteUrl, readRoute } from '../routes/routeConfig.js';

export function useRoute() {
    const [route, setRoute] = useState(readRoute);

    useEffect(() => {
        const handlePopState = () => setRoute(readRoute());
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = useCallback((page, params = {}, replace = false) => {
        window.history[replace ? 'replaceState' : 'pushState']({}, '', createRouteUrl(page, params));
        setRoute(readRoute());
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, []);

    return { ...route, navigate };
}
