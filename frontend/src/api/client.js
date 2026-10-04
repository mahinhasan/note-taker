const TOKEN_KEY = 'careguide.token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      return;
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      return;
    }
  },
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function errorMessage(payload, status) {
  const error = payload && payload.error;
  if (!error) return `Request failed with status ${status}`;
  if (Array.isArray(error.details) && error.details.length) {
    return `${error.message}: ${error.details.map((d) => d.message).join('; ')}`;
  }
  return error.message || `Request failed with status ${status}`;
}

function handleUnauthorized() {
  tokenStore.clear();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

export async function request(path, { method = 'GET', body, params } = {}) {
  const token = tokenStore.get();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`/api${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Network error: could not reach the server', 0);
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401 && token) handleUnauthorized();
    throw new ApiError(errorMessage(payload, response.status), response.status, payload?.error?.details);
  }

  return payload;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
