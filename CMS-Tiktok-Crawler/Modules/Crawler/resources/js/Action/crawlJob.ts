import { api } from '../../../../Core/resources/js/Action/api';

export const getCrawlJobs = (params: Record<string, any> = {}) =>
    api('/crawler/crawl-job/all', { params });

export const getCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}/details`);

export const createCrawlJob = (data: any) =>
    api('/crawler/crawl-job/add', { method: 'POST', data });

export const updateCrawlJob = (id: string | number, data: any) =>
    api(`/crawler/crawl-job/${id}/update`, { method: 'PUT', data });

export const getResults = (id: string | number, params: Record<string, any> = {}) =>
    api(`/crawler/crawl-job/${id}/results`, { params });

export const getStatisticsSummary = () =>
    api('/crawler/crawl-job/statistics-summary');

export const deleteCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}/delete`, { method: 'DELETE' });

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
