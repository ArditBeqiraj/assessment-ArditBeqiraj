import { backendAssetUrl } from '../api.js';
import { formatDate, formatTime, truncate } from '../utils/format.js';
import { AppLink, IconButton } from './ui.jsx';

export function VideoCard({ video, navigate, canDelete = false, deleting = false, onDelete }) {
    const thumbnail = video.thumbnail
        ? backendAssetUrl(`uploads/${video.thumbnail}`)
        : '/images/video-placeholder.svg';

    return (
        <article className="video-card">
            <AppLink className="video-card-link" page="video" params={{ id: video.id }} navigate={navigate}>
                <div className="video-thumb" style={{ backgroundImage: `url("${thumbnail}")` }}>
                    <span className="duration">{formatTime(video.duration_seconds)}</span>
                </div>
                <div className="video-card-body">
                    <h2>{video.title}</h2>
                    <p>{truncate(video.description)}</p>
                    <div>
                        <span className="avatar small">{video.username?.charAt(0).toUpperCase()}</span>
                        <span>{video.username}</span>
                        <time>{formatDate(video.created_at, { month: 'short', day: 'numeric' })}</time>
                    </div>
                </div>
            </AppLink>
            {canDelete && <IconButton
                type="button"
                className="video-delete-button"
                variant="danger"
                icon="trash"
                label={deleting ? 'Deleting video' : 'Delete video'}
                disabled={deleting}
                onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDelete(video);
                }}
            />}
        </article>
    );
}
