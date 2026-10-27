import { api } from '@core/Action/api';

/**
 * Fetch list of crawl jobs with optional pagination and filters.
 * API: GET /crawler/crawl-job
 */
export const getCrawlJobs = (params: Record<string, any> = {}) =>
    api('/crawler/crawl-job', { params });

/**
 * Fetch crawl job details by ID.
 * API: GET /crawler/crawl-job/{id}
 */
export const getCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}`);

/**
 * Create a new crawl job session.
 * API: POST /crawler/crawl-job
 */
export const createCrawlJob = (data: any) =>
    api('/crawler/crawl-job', { method: 'POST', data });

/**
 * Update an existing pending crawl job.
 * API: PUT /crawler/crawl-job/{id}
 */
export const updateCrawlJob = (id: string | number, data: any) =>
    api(`/crawler/crawl-job/${id}`, { method: 'PUT', data });

/**
 * Fetch crawled account results of a specific job.
 * API: GET /crawler/crawl-job/{id}/results
 */
export const getResults = (id: string | number, params: Record<string, any> = {}) =>
    api(`/crawler/crawl-job/${id}/results`, { params });

/**
 * Fetch aggregate crawl job statistics summary for KPI dashboard cards.
 * API: GET /crawler/crawl-job/statistics-summary
 */
export const getStatisticsSummary = () =>
    api('/crawler/crawl-job/statistics-summary');

/**
 * Delete a crawl job by ID.
 * API: DELETE /crawler/crawl-job/{id}
 */
export const deleteCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}`, { method: 'DELETE' });

/**
 * Start execution of a pending crawl job.
 * API: POST /crawler/crawl-job/{id}/start
 */
export const startCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}/start`, { method: 'POST' });

/**
 * Retry execution of a failed crawl job.
 * API: POST /crawler/crawl-job/{id}/retry
 */
export const retryCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}/retry`, { method: 'POST' });

export default {
    getCrawlJobs,
    getCrawlJobByID,
    createCrawlJob,
    updateCrawlJob,
    getStatisticsSummary,
    deleteCrawlJobByID,
    startCrawlJobByID,
    retryCrawlJobByID,
    getResults,
};
