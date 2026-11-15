import { useEffect, useState } from 'react';
import { apiRequest } from '../api.js';
import Layout from '../components/Layout.jsx';
import { AppLink, ConfirmDialog, EmptyState, Icon } from '../components/ui.jsx';
import { VideoCard } from '../components/VideoCard.jsx';

export default function VideosPage({ user, params, navigate, notification, dismissNotification, onLogout, notify, onUnauthorized }) {
    const mine = params.mine === '1';
    const search = params.search || '';
    const page = Math.max(1, Number(params.p) || 1);
    const [query, setQuery] = useState(search);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [confirmVideo, setConfirmVideo] = useState(null);
    const [deletingId, setDeletingId] = useState(0);

    useEffect(() => setQuery(search), [search]);

    useEffect(() => {
        let active = true;
        setError('');
        apiRequest('videos', { params: { mine: mine ? '1' : '', search, p: page } })
            .then(response => active && setData(response.data))
            .catch(requestError => {
                if (!active) return;
                if (requestError.status === 401) onUnauthorized();
                else setError(requestError.message);
            });
        return () => { active = false; };
    }, [mine, search, page, onUnauthorized]);

    function searchVideos(event) {
        event.preventDefault();
        navigate('videos', { ...(mine ? { mine: '1' } : {}), ...(query.trim() ? { search: query.trim() } : {}) });
    }

    function deleteVideo() {
        if (!confirmVideo) return;
        const video = confirmVideo;
        setDeletingId(video.id);
        apiRequest('video', { method: 'DELETE', params: { id: video.id } })
            .then(response => {
                setData(current => current ? {
                    ...current,
                    pagination: {
                        ...current.pagination,
                        items: current.pagination.items.filter(item => item.id !== video.id),
                        total: Math.max(0, current.pagination.total - 1),
                    },
                } : current);
                setConfirmVideo(null);
                notify('success', response.message);
            })
            .catch(requestError => {
                if (requestError.status === 401) return onUnauthorized();
                notify('error', requestError.message);
            })
            .finally(() => setDeletingId(0));
    }

    const pagination = data?.pagination || { items: [], total: 0, page: 1, pages: 1, per_page: 8 };
    const start = pagination.total ? ((pagination.page - 1) * pagination.per_page) + 1 : 0;
    const end = pagination.total ? Math.min(pagination.page * pagination.per_page, pagination.total) : 0;
    const pageParams = nextPage => ({ ...(mine ? { mine: '1' } : {}), ...(search ? { search } : {}), p: nextPage });

    return (
        <Layout user={user} active={mine ? 'mine' : 'videos'} navigate={navigate} notification={notification} dismissNotification={dismissNotification} onLogout={onLogout}>
            <div className="page-heading">
                <div>
                    <span className="section-kicker">Video workspace</span>
                    <h1>{mine ? 'Your videos' : 'Video library'}</h1>
                    <p>{mine ? 'Review the videos you have uploaded.' : 'Watch, annotate, and bookmark shared videos.'}</p>
                </div>
                <AppLink className="button primary" page="upload" navigate={navigate}><Icon name="upload" /><span>Upload video</span></AppLink>
            </div>
            <div className="library-toolbar">
                <div className="tabs">
                    <AppLink className={!mine ? 'active' : ''} page="videos" navigate={navigate}>All videos</AppLink>
                    <AppLink className={mine ? 'active' : ''} page="videos" params={{ mine: '1' }} navigate={navigate}>My videos</AppLink>
                </div>
                <form className="search-form" onSubmit={searchVideos}>
                    <input type="text" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search videos..." role="searchbox" aria-label="Search videos" />
                    <button type="submit" aria-label="Search"><Icon name="search" /></button>
                </form>
            </div>
            <div className="library-shell">
                {error && <p className="page-error">{error}</p>}
                {!data && !error && <div className="section-loading">Loading videos…</div>}
                {data && !pagination.items.length && (
                    <EmptyState
                        title={search ? 'No matching videos' : (mine ? 'You have not uploaded a video yet' : 'No videos yet')}
                        message={search ? 'Try a different search term.' : 'Upload an MP4 video to start reviewing moments.'}
                        action={!search && <AppLink className="button primary" page="upload" navigate={navigate}><Icon name="upload" /><span>Upload video</span></AppLink>}
                    />
                )}
                {Boolean(pagination.items.length) && (
                    <div className="video-grid">
                        {pagination.items.map(video => <VideoCard
                            key={video.id}
                            video={video}
                            navigate={navigate}
                            canDelete={user.role === 'ADMIN' || Number(video.owner_id) === Number(user.id)}
                            deleting={deletingId === video.id}
                            onDelete={setConfirmVideo}
                        />)}
                    </div>
                )}
                <div className="pagination-row">
                    <span>Showing {start}–{end} of {pagination.total}</span>
                    <nav className="pagination" aria-label="Video pagination">
                        {pagination.page > 1 && <AppLink page="videos" params={pageParams(pagination.page - 1)} navigate={navigate}><Icon name="arrow-left" /><span>Previous</span></AppLink>}
                        <span>{pagination.total ? pagination.page : 1} / {pagination.total ? pagination.pages : 1}</span>
                        {pagination.page < pagination.pages && <AppLink page="videos" params={pageParams(pagination.page + 1)} navigate={navigate}><span>Next</span><Icon name="arrow-right" /></AppLink>}
                    </nav>
                </div>
            </div>
            {confirmVideo && <ConfirmDialog
                title="Delete video"
                message={`Are you sure you want to delete “${confirmVideo.title}”? This action cannot be undone.`}
                loading={deletingId === confirmVideo.id}
                onCancel={() => setConfirmVideo(null)}
                onConfirm={deleteVideo}
            />}
        </Layout>
    );
}
