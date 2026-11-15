import { useEffect } from 'react';
import { createRouteUrl } from '../routes/routeConfig.js';
import {
    ArrowLeft, ArrowRight, Bookmark, BookmarkPlus, Check, ChevronRight,
    Circle, CircleAlert, CircleCheck, Clapperboard, LayoutDashboard, Library,
    LogOut, Maximize, MessageSquare, MessageSquarePlus, Minimize, Pause, Pen,
    Play, Search, Square, Trash2, TriangleAlert, Upload, X,
} from 'lucide-react';

const icons = {
    'arrow-left': ArrowLeft,
    'arrow-right': ArrowRight,
    bookmark: Bookmark,
    'bookmark-plus': BookmarkPlus,
    check: Check,
    'chevron-right': ChevronRight,
    circle: Circle,
    'circle-alert': CircleAlert,
    'circle-check': CircleCheck,
    clapperboard: Clapperboard,
    'layout-dashboard': LayoutDashboard,
    library: Library,
    'log-out': LogOut,
    maximize: Maximize,
    'message-square': MessageSquare,
    'message-square-pen': MessageSquarePlus,
    minimize: Minimize,
    pause: Pause,
    pen: Pen,
    play: Play,
    search: Search,
    square: Square,
    trash: Trash2,
    'triangle-alert': TriangleAlert,
    upload: Upload,
    x: X,
};

export function Icon({ name, size, ...props }) {
    const Component = icons[name];
    return Component ? <Component size={size} aria-hidden="true" {...props} /> : null;
}

export function AppLink({ page, params = {}, navigate, children, onClick, ...props }) {
    const href = createRouteUrl(page, params);

    function handleClick(event) {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(page, params);
    }

    return <a href={href} onClick={handleClick} {...props}>{children}</a>;
}

export function Button({ icon, children, variant = 'primary', wide = false, loading = false, className = '', ...props }) {
    const classes = ['button', variant, wide && 'wide', className].filter(Boolean).join(' ');

    return (
        <button className={classes} {...props} disabled={loading || props.disabled}>
            {icon && <Icon name={icon} />}
            <span className="button-label">{loading ? 'Please wait…' : children}</span>
        </button>
    );
}

export function IconButton({ icon, label, variant = '', className = '', ...props }) {
    return (
        <button className={`icon-button ${variant} ${className}`.trim()} aria-label={label} title={label} {...props}>
            <Icon name={icon} />
        </button>
    );
}

export function Field({ label, optional, error, as = 'input', className = '', ...props }) {
    const Control = as;
    return (
        <div className={`form-field ${className}`.trim()}>
            <label className={optional ? 'field-label-row' : undefined} htmlFor={props.id}>
                {optional ? <><span>{label}</span><span className="field-optional">(optional)</span></> : label}
            </label>
            <Control aria-invalid={Boolean(error)} {...props} />
            <div className={`validation-slot ${error ? 'is-visible' : ''}`}>
                <p className="inline-error" aria-live="polite">
                    {error && <><Icon name="triangle-alert" /><span>{error}</span></>}
                </p>
            </div>
        </div>
    );
}

export function FormError({ message }) {
    return (
        <div className={`validation-slot form-level-validation ${message ? 'is-visible' : ''}`}>
            <p className="inline-error" aria-live="polite">
                {message && <><Icon name="triangle-alert" /><span>{message}</span></>}
            </p>
        </div>
    );
}

export function Notification({ notification, onDismiss }) {
    useEffect(() => {
        if (!notification) return undefined;
        const timer = window.setTimeout(onDismiss, 4200);
        return () => window.clearTimeout(timer);
    }, [notification, onDismiss]);

    return (
        <div className="notification-region" aria-live="polite" aria-atomic="true">
            {notification && (
                <div className={`notification notification-${notification.type || 'success'} is-visible`}>
                    <span className="notification-icon" aria-hidden="true">
                        <Icon name={notification.type === 'error' ? 'circle-alert' : 'circle-check'} />
                    </span>
                    <p>{notification.message}</p>
                    <button type="button" className="notification-close" aria-label="Dismiss notification" onClick={onDismiss}>
                        <Icon name="x" />
                    </button>
                </div>
            )}
        </div>
    );
}

export function LoadingScreen() {
    return <div className="app-loading" role="status"><span className="loading-spinner" />Loading VideoLab…</div>;
}

export function EmptyState({ icon = 'clapperboard', title, message, action }) {
    return (
        <div className="empty-state">
            <div className="empty-icon" aria-hidden="true"><Icon name={icon} /></div>
            <h2>{title}</h2>
            <p>{message}</p>
            {action}
        </div>
    );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', loading = false, onCancel, onConfirm }) {
    return (
        <div className="confirm-modal" role="presentation" onMouseDown={event => event.target === event.currentTarget && !loading && onCancel()}>
            <div className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirm_title">
                <h3 id="confirm_title">{title}</h3>
                <p>{message}</p>
                <div className="confirm-actions">
                    <Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>Cancel</Button>
                    <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
                </div>
            </div>
        </div>
    );
}
