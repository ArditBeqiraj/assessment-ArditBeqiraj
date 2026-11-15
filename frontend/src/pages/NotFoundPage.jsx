import Layout from '../components/Layout.jsx';
import { AppLink } from '../components/ui.jsx';

export default function NotFoundPage({ user, navigate, notification, dismissNotification, onLogout }) {
    return (
        <Layout user={user} active="" navigate={navigate} notification={notification} dismissNotification={dismissNotification} onLogout={onLogout}>
            <div className="not-found panel">
                <span className="section-kicker">404</span>
                <h1>Page not found</h1>
                <p>The page you requested does not exist.</p>
                <AppLink className="button primary" page="videos" navigate={navigate}>Back to videos</AppLink>
            </div>
        </Layout>
    );
}
