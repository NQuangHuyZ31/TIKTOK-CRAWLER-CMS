import { api } from '@core/Action/api';

const baseURL = '/tiktok-account/tiktok-account';

/**
 * Fetch all TikTok accounts with optional pagination and filters.
 * API: GET /tiktok-account/tiktok-account
 */
export const getAllTiktokAccounts = (params: Record<string, any> = {}) =>
	api(`${baseURL}`, { params });

/**
 * Fetch TikTok account details by ID.
 * API: GET /tiktok-account/tiktok-account/{id}
 */
export const getTiktokAccountByID = (id: string | number) =>
	api(`${baseURL}/${id}`);

/**
 * Create a new TikTok account (supports JSON or multipart FormData for avatar uploads).
 * API: POST /tiktok-account/tiktok-account
 */
export const createTiktokAccount = (data: any) =>
	api(`${baseURL}`, { method: 'POST', data });

/**
 * Update TikTok account details (supports JSON or multipart FormData for avatar uploads).
 * API: POST or PUT /tiktok-account/tiktok-account/{id}
 */
export const updateTiktokAccount = (id: string | number, data: any) => {
	if (data instanceof FormData) {
		if (!data.has('_method')) {
			data.append('_method', 'PUT');
		}
		return api(`${baseURL}/${id}`, { method: 'POST', data });
	}
	return api(`${baseURL}/${id}`, { method: 'PUT', data });
};

/**
 * Delete TikTok account by ID.
 * API: DELETE /tiktok-account/tiktok-account/{id}
 */
export const deleteTiktokAccount = (id: string | number) =>
	api(`${baseURL}/${id}`, { method: 'DELETE' });

/**
 * Update TikTok account status (active/inactive/banned).
 * API: PATCH /tiktok-account/tiktok-account/{id}/status
 */
export const updateTiktokAccountStatus = (id: string | number, status: string | number) =>
	api(`${baseURL}/${id}/status`, { method: 'PATCH', data: { status } });

/**
 * Fetch crawl history / results of a specific TikTok account.
 * API: GET /tiktok-account/tiktok-account/{id}/results
 */
export const getResults = (id: string | number, params: Record<string, any> = {}) =>
	api(`${baseURL}/${id}/results`, { params });

/**
 * Fetch aggregate TikTok account statistics summary for KPI dashboard cards.
 * API: GET /tiktok-account/tiktok-account/statistic-summary
 */
export const getStatisticSummary = () =>
	api(`${baseURL}/statistic-summary`);

export default {
	getAllTiktokAccounts,
	getTiktokAccountByID,
	createTiktokAccount,
	deleteTiktokAccount,
	updateTiktokAccountStatus,
	updateTiktokAccount,
	getStatisticSummary,
	getResults,
};
