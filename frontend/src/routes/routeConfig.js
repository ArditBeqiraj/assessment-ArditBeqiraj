function basePath() {
    return import.meta.env.BASE_URL.replace(/^\/+|\/+$/g, '');
}

function withQuery(path, params, excluded = []) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (!excluded.includes(key) && value !== '' && value !== null && value !== undefined && value !== false) {
            query.set(key, String(value));
        }
    });

    const search = query.toString();
    return `${basePath()}/${path}${search ? `?${search}` : ''}`;
}

export function createRouteUrl(page, params = {}) {
    switch (page) {
        case 'auth':
            return withQuery(params.mode === 'register' ? 'register' : 'login', params, ['mode']);
        case 'videos':
            return withQuery('videos', params);
        case 'video':
            return withQuery(`videos/${encodeURIComponent(params.id)}`, params, ['id']);
        case 'upload':
            return withQuery('upload', params);
        case 'admin':
            return withQuery('admin', params);
        default:
            return withQuery(page || '', params);
    }
}

export function readRoute() {
    const search = new URLSearchParams(window.location.search);

    if (search.has('page')) {
        return {
            page: search.get('page') || '',
            params: Object.fromEntries(search.entries()),
        };
    }

    const configuredBase = basePath();
    let path = window.location.pathname;
    if (configuredBase && path.startsWith(configuredBase)) {
        path = path.slice(configuredBase.length);
    }
    path = path.replace(/^\/+|\/+$/g, '');

    const params = Object.fromEntries(search.entries());
    if (path === '') return { page: '', params };
    if (path === 'login') return { page: 'auth', params };
    if (path === 'register') return { page: 'auth', params: { ...params, mode: 'register' } };
    if (path === 'videos') return { page: 'videos', params };
    if (path === 'upload') return { page: 'upload', params };
    if (path === 'admin') return { page: 'admin', params };

    const videoMatch = path.match(/^videos\/(\d+)$/);
    if (videoMatch) {
        return { page: 'video', params: { ...params, id: videoMatch[1] } };
    }

    return { page: 'not-found', params };
}
