import { Icon, IconButton } from './ui.jsx';
import { MomentItem } from './MomentItem.jsx';
import { formatTime } from '../utils/format.js';

export function MomentSection({ type, items, onAdd, onSelect, children }) {
    const annotation = type === 'annotation';
    return (
        <div className="moment-section">
            <div className="moment-title">
                <div>
                    <span className="section-kicker">{annotation ? 'On the frame' : 'Saved moments'}</span>
                    <h2>{annotation ? 'Annotations' : 'Bookmarks'}</h2>
                </div>
                <div className="moment-actions">
                    <button className="mini-button" type="button" onClick={onAdd}>
                        <Icon name={annotation ? 'message-square-pen' : 'bookmark-plus'} />
                        <span>Add {type}</span>
                    </button>
                    <span>{items.length}</span>
                </div>
            </div>
            <div className="moment-list">
                {items.map(item => <MomentItem key={item.id} item={item} type={type} onSelect={onSelect} />)}
                {!items.length && <p className="list-empty">No {annotation ? 'annotations' : 'bookmarks'} yet.</p>}
            </div>
            {children}
        </div>
    );
}

export function MomentComposer({ type, open, timestamp, value, onChange, onCancel, onSubmit, tool, onToolChange, error, descriptionError, loading }) {
    const annotation = type === 'annotation';
    return (
        <form className={`moment-popover ${open ? '' : 'hidden'} ${error ? 'has-validation-error' : ''}`} onSubmit={onSubmit} noValidate>
            {annotation && (
                <div className="annotation-tools" aria-label="Annotation drawing tools">
                    {[
                        ['pen', 'Pen'],
                        ['circle', 'Circle'],
                        ['rect', 'Rectangle'],
                    ].map(([toolValue, label]) => (
                        <button
                            key={toolValue}
                            type="button"
                            className={`annotation-tool ${tool === toolValue ? 'is-active' : ''}`}
                            aria-label={label}
                            title={label}
                            onClick={() => onToolChange(toolValue)}
                        >
                            <Icon name={toolValue === 'rect' ? 'square' : toolValue} />
                        </button>
                    ))}
                </div>
            )}
            <div className="moment-input-row">
                <span className="moment-time">{formatTime(timestamp)}</span>
                <div className={`moment-input-wrap ${descriptionError ? 'has-description-error' : ''}`}>
                    <input
                        type="text"
                        value={value}
                        maxLength={annotation ? 200 : 100}
                        placeholder={annotation ? 'What should viewers notice?' : 'Name this moment'}
                        aria-describedby={`${type}_error`}
                        onChange={event => onChange(event.target.value)}
                    />
                </div>
                <div className="composer-actions">
                    <IconButton type="button" icon="x" label={`Cancel ${type}`} variant="danger" onClick={onCancel} />
                    <IconButton type="submit" icon="check" label={`Save ${type}`} variant="success" disabled={loading} />
                </div>
            </div>
            <div className="moment-validation-row">
                <div className="moment-validation-inner">
                    <p className="form-error" id={`${type}_error`} aria-live="polite">
                        {error && <><Icon name="triangle-alert" /><span>{error}</span></>}
                    </p>
                </div>
            </div>
        </form>
    );
}
