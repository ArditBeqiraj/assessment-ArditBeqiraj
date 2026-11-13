import { useState } from 'react';
import { Button, Notification } from './ui.jsx';
import Sidebar from './Sidebar.jsx';

export default function Layout({ user, active, navigate, notification, dismissNotification, onLogout, children }) {
    const [confirmLogout, setConfirmLogout] = useState(false);

    return (
        <div className="page-shell">
            <Sidebar
                user={user}
                active={active}
                navigate={navigate}
                onRequestLogout={() => setConfirmLogout(true)}
            />

            <main className="main-content">
                {confirmLogout && (
                    <div
                        className="confirm-modal"
                        role="presentation"
                        onMouseDown={event => event.target === event.currentTarget && setConfirmLogout(false)}
                    >
                        <div className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="logout_title">
                            <h3 id="logout_title">Log out</h3>
                            <p>Are you sure you want to log out?</p>
                            <div className="confirm-actions">
                                <Button type="button" variant="secondary" onClick={() => setConfirmLogout(false)}>Cancel</Button>
                                <Button type="button" onClick={() => { setConfirmLogout(false); onLogout(); }}>Log out</Button>
                            </div>
                        </div>
                    </div>
                )}
                <Notification notification={notification} onDismiss={dismissNotification} />
                {children}
            </main>
        </div>
    );
}
