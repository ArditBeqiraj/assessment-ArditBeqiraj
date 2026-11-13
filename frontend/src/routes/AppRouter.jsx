import { LoadingScreen } from '../components/ui.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import AuthPage from '../pages/AuthPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import UploadPage from '../pages/UploadPage.jsx';
import VideoPage from '../pages/VideoPage.jsx';
import VideosPage from '../pages/VideosPage.jsx';

const routes = {
    videos: { component: VideosPage },
    upload: { component: UploadPage },
    video: { component: VideoPage },
    admin: { component: AdminPage, adminOnly: true },
};

export default function AppRouter({
    page,
    params,
    user,
    navigate,
    notification,
    dismissNotification,
    onLogout,
    notify,
    onUnauthorized,
    onAuthenticated,
}) {
    if (!user) {
        return (
            <AuthPage
                mode={params.mode === 'register' ? 'register' : 'login'}
                navigate={navigate}
                onAuthenticated={onAuthenticated}
            />
        );
    }

    if (!page || page === 'auth') {
        return <LoadingScreen />;
    }

    const route = routes[page];
    if (!route || (route.adminOnly && user.role !== 'ADMIN')) {
        return <NotFoundPage user={user} navigate={navigate} notification={notification} dismissNotification={dismissNotification} onLogout={onLogout} />;
    }

    const Page = route.component;
    return (
        <Page
            user={user}
            params={params}
            navigate={navigate}
            notification={notification}
            dismissNotification={dismissNotification}
            onLogout={onLogout}
            notify={notify}
            onUnauthorized={onUnauthorized}
        />
    );
}
