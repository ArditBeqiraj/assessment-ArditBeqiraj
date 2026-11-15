const API_ENDPOINT = new URL(
    import.meta.env.VITE_API_URL || 'http://localhost:8080/api.php',
    window.location.origin,
);

let csrfToken = '';

export class ApiError extends Error {
    constructor(message, status = 0, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

function requestUrl(resource, params = {}) {
    const url = new URL(API_ENDPOINT);
    url.searchParams.set('resource', resource);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined && value !== false) {
            url.searchParams.set(key, String(value));
        }
    });

    return url;
}

export function apiRequest(resource, options = {}) {
    const method = options.method || 'GET';
    return fetch(requestUrl(resource, options.params), {
        method,
        body: options.body,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            ...(method !== 'GET' && method !== 'HEAD' && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
            ...(options.headers || {}),
        },
    })
        .then(response => response.text().then(text => {
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new ApiError('The server returned an invalid response.', response.status);
            }

            if (data.data?.csrfToken) {
                csrfToken = data.data.csrfToken;
            }

            if (!response.ok || data.status !== 'success') {
                throw new ApiError(data.message || 'The request could not be completed.', response.status, data);
            }

            return data;
        }))
        .catch(error => {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Unable to connect to the server. Please try again.');
        });
}

export function apiUrl(resource, params = {}) {
    return requestUrl(resource, params).toString();
}

export function backendAssetUrl(path) {
    return new URL(String(path).replace(/^\/+/, ''), new URL('./', API_ENDPOINT)).toString();
}
