import { RobotOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import CrawlJobsPage from '../pages/CrawlJobsPage';
import CreateCrawlJobPage from '../pages/CreateCrawlJobPage';
import CrawlJobDetailPage from '../pages/CrawlJobDetailPage';
import EditCrawlJobPage from '../pages/EditCrawlJobPage';

const crawlerRoutes: RouteDef[] = [
    {
        path: '/crawler/crawl-job',
        component: CrawlJobsPage,
        layout: 'admin',
        title: 'Crawl Jobs',
        label: 'Crawl Jobs',
        icon: RobotOutlined,
        order: 10,
    },
    {
        path: '/crawler/crawl-job/create',
        component: CreateCrawlJobPage,
        layout: 'admin',
        title: 'Create Crawl Job',
    },
    {
        path: '/crawler/crawl-job/:id/edit',
        component: EditCrawlJobPage,
        layout: 'admin',
        title: 'Edit Crawl Job',
    },
    {
        path: '/crawler/crawl-job/:id',
        component: CrawlJobDetailPage,
        layout: 'admin',
        title: 'Crawl Job Details',
    },
];

export default crawlerRoutes;