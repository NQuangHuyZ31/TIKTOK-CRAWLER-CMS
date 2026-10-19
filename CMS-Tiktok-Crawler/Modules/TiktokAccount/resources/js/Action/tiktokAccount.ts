import { api } from '../../../../Core/resources/js/Action/api';

const baseURL = '/tiktok-account/tiktok-account';

export const getAllTiktokAccounts = (params: Record<string, any> = {}) =>
    api(`${baseURL}/all`, { params });

export const getTiktokAccountByID = (id: string | number) =>
    api(`${baseURL}/${id}/details`);

export const deleteTiktokAccount = (id: string | number) =>
    api(`${baseURL}/${id}/delete`, { method: 'DELETE' });

export const updateTiktokAccountStatus = (id: string | number, status: string | number) =>
    api(`${baseURL}/${id}/status`, { method: 'PATCH', data: { status } });

export const updateTiktokAccount = (id: string | number, data: any) => {
    if (data instanceof FormData) {
        data.append('_method', 'PUT');
        return api(`${baseURL}/${id}/update`, { method: 'POST', data });
    }
    return api(`${baseURL}/${id}/update`, { method: 'PUT', data });
};

export const getResults = (id: string | number, params: Record<string, any> = {}) =>
    api(`${baseURL}/${id}/results`, { params });

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
