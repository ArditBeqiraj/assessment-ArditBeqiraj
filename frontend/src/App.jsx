import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from './api.js';
import { useRoute } from './hooks/useRoute.js';
import { LoadingScreen } from './components/ui.jsx';
import AppRouter from './routes/AppRouter.jsx';

export default function App() {
    const { page, params, navigate } = useRoute();
    const [user, setUser] = useState(null);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [notification, setNotification] = useState(null);

    const notify = useCallback((type, message) => {
        setNotification({ type, message, id: Date.now() });
    }, []);

    const dismissNotification = useCallback(() => setNotification(null), []);

    const onUnauthorized = useCallback(() => {
        setUser(null);
        setNotification(null);
        navigate('auth', {}, true);
    }, [navigate]);

    useEffect(() => {
        apiRequest('session')
            .then(response => setUser(response.data.user || null))
            .catch(() => setUser(null))
            .finally(() => setSessionLoaded(true));
    }, []);

    useEffect(() => {
        if (!sessionLoaded) return;

        if (!user && page !== 'auth') {
            navigate('auth', {}, true);
            return;
        }

        if (user && (!page || page === 'auth')) {
            navigate(user.role === 'ADMIN' ? 'admin' : 'videos', {}, true);
        }
    }, [sessionLoaded, user, page, navigate]);

    useEffect(() => {
        document.body.className = user && page === 'video'
            ? 'video-page'
            : (user && page === 'videos' ? 'library-page' : '');

        const titles = {
            auth: 'Account',
            videos: 'Videos',
            upload: 'Upload video',
            video: 'Video review',
            admin: 'Admin dashboard',
        };
        document.title = `${titles[page] || 'VideoLab'} · VideoLab`;
    }, [user, page]);

    const authenticated = useCallback((nextUser, message) => {
        setUser(nextUser);
        notify('success', message);
        navigate(nextUser.role === 'ADMIN' ? 'admin' : 'videos', {}, true);
    }, [navigate, notify]);

    const logout = useCallback(() => {
        apiRequest('logout', { method: 'POST', body: new FormData() })
            .then(() => {
                setUser(null);
                setNotification(null);
                navigate('auth', {}, true);
            })
            .catch(error => notify('error', error.message));
    }, [navigate, notify]);

    if (!sessionLoaded) return <LoadingScreen />;

    return (
        <AppRouter
            page={page}
            params={params}
            user={user}
            navigate={navigate}
            notification={notification}
            dismissNotification={dismissNotification}
            onLogout={logout}
            notify={notify}
            onUnauthorized={onUnauthorized}
            onAuthenticated={authenticated}
        />
    );
}
