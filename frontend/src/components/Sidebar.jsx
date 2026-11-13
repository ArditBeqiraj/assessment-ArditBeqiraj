import { AppLink, Icon } from './ui.jsx';

export default function Sidebar({ user, active, navigate, onRequestLogout }) {
    const navItems = [
        ...(user.role === 'ADMIN'
            ? [{ key: 'admin', page: 'admin', icon: 'layout-dashboard', label: 'Dashboard' }]
            : []),
        { key: 'videos', page: 'videos', icon: 'clapperboard', label: 'Videos' },
        { key: 'mine', page: 'videos', params: { mine: '1' }, icon: 'library', label: 'My Videos' },
        { key: 'upload', page: 'upload', icon: 'upload', label: 'Upload' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <AppLink className="brand" page="videos" navigate={navigate}>
                    <span className="brand-mark">
                        <img src="/images/videomanager-logo.svg" alt="" width="52" height="52" />
                    </span>
                    <span>VideoLab</span>
                </AppLink>

                <nav className="nav-stack" aria-label="Primary navigation">
                    {navItems.map(item => (
                        <AppLink
                            key={item.key}
                            className={`nav-item ${active === item.key ? 'active' : ''}`}
                            page={item.page}
                            params={item.params}
                            navigate={navigate}
                            aria-current={active === item.key ? 'page' : undefined}
                        >
                            <span className="nav-icon" aria-hidden="true"><Icon name={item.icon} /></span>
                            <span>{item.label}</span>
                        </AppLink>
                    ))}
                </nav>
            </div>

            <div className="sidebar-bottom">
                <div className="user-profile">
                    <div className="avatar">{user.username?.charAt(0).toUpperCase() || 'U'}</div>
                    <div className="meta">
                        <strong>{user.username}</strong>
                        <small>{user.email}</small>
                    </div>
                </div>
                <button className="logout-trigger" type="button" aria-label="Log out" onClick={onRequestLogout}>
                    <Icon name="log-out" />
                </button>
            </div>
        </aside>
    );
}
