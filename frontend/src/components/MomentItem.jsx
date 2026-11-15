import { formatTime } from '../utils/format.js';

export function MomentItem({ item, type, onSelect }) {
    return (
        <button type="button" data-time={item.timestamp} onClick={() => onSelect(Number(item.timestamp))}>
            <span className="moment-time">{formatTime(item.timestamp)}</span>
            <strong>{type === 'annotation' ? item.description : item.title}</strong>
            <small>{item.username}</small>
        </button>
    );
}
