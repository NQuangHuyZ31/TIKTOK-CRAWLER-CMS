import { lazy } from 'react';
import type { RouteDef } from '@core/routes/registry';

const CrawlJobsPage = lazy(() => import('../pages/CrawlJobsPage'));
const CreateCrawlJobPage = lazy(() => import('../pages/CreateCrawlJobPage'));
const CrawlJobDetailPage = lazy(() => import('../pages/CrawlJobDetailPage'));
const EditCrawlJobPage = lazy(() => import('../pages/EditCrawlJobPage'));

const crawlerRoutes: RouteDef[] = [
    {
        path: '/crawler/crawl-job',
        component: CrawlJobsPage,
        title: 'Crawl Jobs',
        label: 'Crawl Jobs',
        order: 10,
    },
    {
        path: '/crawler/crawl-job/create',
        component: CreateCrawlJobPage,
        title: 'Create Crawl Job',
    },
    {
        path: '/crawler/crawl-job/:id/edit',
        component: EditCrawlJobPage,
        title: 'Edit Crawl Job',
    },
    {
        path: '/crawler/crawl-job/:id',
        component: CrawlJobDetailPage,
        title: 'Crawl Job Details',
    },
];

export default crawlerRoutes;