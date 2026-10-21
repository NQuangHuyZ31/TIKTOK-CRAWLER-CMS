import { api } from '@core/Action/api';

export const getCrawlJobs = (params: Record<string, any> = {}) =>
    api('/crawler/crawl-job', { params });

export const getCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}`);

export const createCrawlJob = (data: any) =>
    api('/crawler/crawl-job', { method: 'POST', data });

export const updateCrawlJob = (id: string | number, data: any) =>
    api(`/crawler/crawl-job/${id}`, { method: 'PUT', data });

export const getResults = (id: string | number, params: Record<string, any> = {}) =>
    api(`/crawler/crawl-job/${id}/results`, { params });

export const getStatisticsSummary = () =>
    api('/crawler/crawl-job/statistics-summary');

export const deleteCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}`, { method: 'DELETE' });

export const startCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}/start`, { method: 'POST' });

export default {
    getCrawlJobs,
    getCrawlJobByID,
    createCrawlJob,
    updateCrawlJob,
    getStatisticsSummary,
    deleteCrawlJobByID,
    startCrawlJobByID,
    getResults,
};
