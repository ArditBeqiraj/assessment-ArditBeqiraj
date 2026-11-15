import { formatDate } from '../utils/format.js';

export function UserItem({ account }) {
    return (
        <article className="user-row">
            <span className="user-avatar" aria-hidden="true">{account.username?.charAt(0).toUpperCase()}</span>
            <span className="user-copy">
                <strong>{account.first_name} {account.last_name}</strong>
                <small>@{account.username} · {account.email}</small>
            </span>
            <span className={`role-badge ${account.role === 'ADMIN' ? 'admin' : ''}`}>
                {account.role?.charAt(0) + account.role?.slice(1).toLowerCase()}
            </span>
            <time dateTime={account.created_at}>{formatDate(account.created_at)}</time>
        </article>
    );
}
