import { useState } from 'react';
import { ConfirmDialog, Notification } from './ui.jsx';
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
                    <ConfirmDialog
                        title="Log out"
                        message="Are you sure you want to log out?"
                        confirmLabel="Log out"
                        onCancel={() => setConfirmLogout(false)}
                        onConfirm={() => { setConfirmLogout(false); onLogout(); }}
                    />
                )}
                <Notification notification={notification} onDismiss={dismissNotification} />
                {children}
            </main>
        </div>
    );
}
