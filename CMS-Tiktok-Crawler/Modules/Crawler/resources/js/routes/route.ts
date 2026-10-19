import CrawlJobsPage from '../pages/CrawlJobsPage';
import CreateCrawlJobPage from '../pages/CreateCrawlJobPage';
import CrawlJobDetailPage from '../pages/CrawlJobDetailPage';
import EditCrawlJobPage from '../pages/EditCrawlJobPage';
import type { RouteDef } from '../../../../Core/resources/js/routes/registry';

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
