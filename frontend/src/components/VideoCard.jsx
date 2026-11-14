import { backendAssetUrl } from '../api.js';
import { formatDate, formatTime, truncate } from '../utils/format.js';
import { AppLink } from './ui.jsx';

export function VideoCard({ video, navigate }) {
    const thumbnail = video.thumbnail
        ? backendAssetUrl(`uploads/${video.thumbnail}`)
        : '/images/video-placeholder.svg';

    return (
        <AppLink className="video-card" page="video" params={{ id: video.id }} navigate={navigate}>
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
    );
}
