import { api } from '@core/Action/api';

const baseURL = '/tiktok-account/tiktok-account';

/**
 * Fetch all TikTok accounts with optional pagination and filters.
 * API: GET /tiktok-account/tiktok-account
 * Example: getAllTiktokAccounts({ page: 1, per_page: 10, search: 'huyak' })
 */
export const getAllTiktokAccounts = (params: Record<string, any> = {}) =>
    api(`${baseURL}`, { params });

/**
 * Fetch TikTok account details by ID.
 * API: GET /tiktok-account/tiktok-account/{id}
 * Example: getTiktokAccountByID(1)
 */
export const getTiktokAccountByID = (id: string | number) =>
    api(`${baseURL}/${id}`);

/**
 * Update TikTok account details (supports FormData / multipart).
 * API: POST or PUT /tiktok-account/tiktok-account/{id}
 * Example: updateTiktokAccount(1, formData)
 */
export const updateTiktokAccount = (id: string | number, data: any) => {
    return api(`${baseURL}/${id}`, { method: 'PUT', data });
};

/**
 * Delete TikTok account by ID.
 * API: DELETE /tiktok-account/tiktok-account/{id}
 * Example: deleteTiktokAccount(1)
 */
export const deleteTiktokAccount = (id: string | number) =>
    api(`${baseURL}/${id}`, { method: 'DELETE' });

/**
 * Update TikTok account status (active/inactive).
 * API: PATCH /tiktok-account/tiktok-account/{id}/status
 * Example: updateTiktokAccountStatus(1, 'active')
 */
export const updateTiktokAccountStatus = (id: string | number, status: string | number) =>
    api(`${baseURL}/${id}/status`, { method: 'PATCH', data: { status } });

/**
 * Fetch crawl history / results of a specific TikTok account.
 * API: GET /tiktok-account/tiktok-account/{id}/results
 * Example: getResults(1, { page: 1, per_page: 10 })
 */
export const getResults = (id: string | number, params: Record<string, any> = {}) =>
    api(`${baseURL}/${id}/results`, { params });

/**
 * Fetch aggregate TikTok account statistics summary for KPI dashboard cards.
 * API: GET /tiktok-account/tiktok-account/statistic-summary
 * Example: getStatisticSummary()
 */
export const getStatisticSummary = () =>
    api(`${baseURL}/statistic-summary`);

export default {
    getAllTiktokAccounts,
    getTiktokAccountByID,
    deleteTiktokAccount,
    updateTiktokAccountStatus,
    updateTiktokAccount,
    getStatisticSummary,
    getResults,
};
