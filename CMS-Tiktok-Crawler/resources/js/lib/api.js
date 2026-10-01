const API_BASE = '/api';

async function requestJson(url, options = {}) {
	const response = await fetch(`${API_BASE}${url}`, {
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...(options.headers || {}),
		},
		...options,
	});

	const contentType = response.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	const payload = isJson ? await response.json() : await response.text();

	if (!response.ok) {
		const message = typeof payload === 'string'
			? payload
			: payload?.message || 'Request failed';

		throw new Error(message);
	}

	return payload;
}

export const api = {
	get: (url, options = {}) => requestJson(url, { method: 'GET', ...options }),
	post: (url, body, options = {}) => requestJson(url, {
		method: 'POST',
		body: JSON.stringify(body ?? {}),
		...options,
	}),
	getCrawlJobs: () => api.get('/crawlers/crawl-jobs'),
	getCrawlJobById: (id) => api.get(`/crawlers/crawl-jobs/${id}`),
	getCrawlResultsByJobId: (id) => api.get(`/crawlers/crawl-jobs/${id}/results`),
};

export default api;
