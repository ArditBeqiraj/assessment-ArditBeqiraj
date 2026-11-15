import { backendAssetUrl } from '../api.js';
import { formatDate, formatTime } from '../utils/format.js';
import { AppLink, Icon } from './ui.jsx';

export function LatestVideoItem({ video, navigate }) {
    const thumbnail = video.thumbnail
        ? backendAssetUrl(`uploads/${video.thumbnail}`)
        : '/images/video-placeholder.svg';

    return (
        <AppLink className="recent-video" page="video" params={{ id: video.id }} navigate={navigate}>
            <span className="recent-video-thumb" style={{ backgroundImage: `url("${thumbnail}")` }}>
                <small>{formatTime(video.duration_seconds)}</small>
            </span>
            <span className="recent-video-copy">
                <strong>{video.title}</strong>
                <small>{video.username} · {formatDate(video.created_at)}</small>
            </span>
            <Icon name="chevron-right" />
        </AppLink>
    );
}
