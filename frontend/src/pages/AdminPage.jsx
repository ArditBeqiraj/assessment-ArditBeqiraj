import { useEffect, useState } from 'react';
import { apiRequest } from '../api.js';
import Layout from '../components/Layout.jsx';
import { AppLink, Icon } from '../components/ui.jsx';
import { LatestVideoItem } from '../components/LatestVideoItem.jsx';
import { UserItem } from '../components/UserItem.jsx';

export default function AdminPage({ user, params, navigate, notification, dismissNotification, onLogout, onUnauthorized }) {
    const usersPage = Math.max(1, Number(params.users_page) || 1);
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setError('');
        apiRequest('admin', { params: { users_page: usersPage } })
            .then(response => active && setDashboard(response.data))
            .catch(requestError => {
                if (!active) return;
                if (requestError.status === 401) onUnauthorized();
                else setError(requestError.message);
            });
        return () => { active = false; };
    }, [usersPage, onUnauthorized]);

    const stats = dashboard?.stats || {};
    const recentVideos = dashboard?.recentVideos || [];
    const pagination = dashboard?.userPagination || { items: [], total: 0, page: 1, pages: 1, per_page: 5 };
    const start = pagination.total ? ((pagination.page - 1) * pagination.per_page) + 1 : 0;
    const end = pagination.total ? Math.min(pagination.page * pagination.per_page, pagination.total) : 0;

    return (
        <Layout user={user} active="admin" navigate={navigate} notification={notification} dismissNotification={dismissNotification} onLogout={onLogout}>
            <div className="page-heading admin-heading">
                <div>
                    <span className="section-kicker">Platform overview</span>
                    <h1>Admin dashboard</h1>
                    <p>A quick overview of activity across VideoLab.</p>
                </div>
            </div>
            {error && <p className="page-error">{error}</p>}
            {!dashboard && !error && <div className="section-loading">Loading dashboard…</div>}
            {dashboard && <>
                <div className="stats-grid">
                    <Stat icon="clapperboard" label="Total videos" value={stats.videos} />
                    <Stat icon="message-square" label="Total annotations" value={stats.annotations} />
                    <Stat icon="bookmark" label="Total bookmarks" value={stats.bookmarks} />
                </div>
                <div className="dashboard-content">
                    <section className="dashboard-panel">
                        <header className="panel-heading">
                            <div><span className="section-kicker">Recently added</span><h2>Latest videos</h2></div>
                            <AppLink page="videos" navigate={navigate}><span>View all</span><Icon name="arrow-right" /></AppLink>
                        </header>
                        <div className="recent-video-list">
                            {recentVideos.map(video => <LatestVideoItem key={video.id} video={video} navigate={navigate} />)}
                            {!recentVideos.length && <p className="dashboard-empty">No videos have been uploaded yet.</p>}
                        </div>
                    </section>
                    <section className="dashboard-panel">
                        <header className="panel-heading">
                            <div><span className="section-kicker">Accounts</span><h2>Users</h2></div>
                            <span className="panel-count">{pagination.total} total</span>
                        </header>
                        <div className="user-list">
                            {pagination.items.map(account => <UserItem key={account.id} account={account} />)}
                            {!pagination.items.length && <p className="dashboard-empty">No users found.</p>}
                        </div>
                        <footer className="user-pagination">
                            <span>Showing {start}–{end} of {pagination.total}</span>
                            <nav aria-label="User pagination">
                                {pagination.page > 1 && <AppLink page="admin" params={{ users_page: pagination.page - 1 }} navigate={navigate} aria-label="Previous users"><Icon name="arrow-left" /></AppLink>}
                                <span>{pagination.page} / {pagination.pages}</span>
                                {pagination.page < pagination.pages && <AppLink page="admin" params={{ users_page: pagination.page + 1 }} navigate={navigate} aria-label="Next users"><Icon name="arrow-right" /></AppLink>}
                            </nav>
                        </footer>
                    </section>
                </div>
            </>}
        </Layout>
    );
}

function Stat({ icon, label, value = 0 }) {
    return (
        <article className="stat-card">
            <span className="stat-icon" aria-hidden="true"><Icon name={icon} /></span>
            <div><span>{label}</span><strong>{value}</strong></div>
        </article>
    );
}
