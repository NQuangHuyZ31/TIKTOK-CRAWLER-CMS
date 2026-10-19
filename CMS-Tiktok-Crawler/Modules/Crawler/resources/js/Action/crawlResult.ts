import { api } from '../../../../Core/resources/js/Action/api';

export const getCrawlResultByCrawlJobID = (id: string | number, params: Record<string, any> = {}) =>
    api(`/crawlers/crawl-jobs/${id}/results`, { params });

export const getCrawlResultByAccountID = (id: string | number, params: Record<string, any> = {}) =>
    api(`/crawlers/tiktok-accounts/${id}/crawl-results`, { params });

export default {
    getCrawlResultByCrawlJobID,
    getCrawlResultByAccountID,
};
