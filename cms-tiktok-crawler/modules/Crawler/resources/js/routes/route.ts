import { RobotOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import CrawlJobsPage from '../pages/CrawlJobsPage';
import CrawlJobDetailPage from '../pages/CrawlJobDetailPage';
import CrawlJobFormPage from '../pages/CrawlJobFormPage';

const crawlerRoutes: RouteDef[] = [
    {
        path: '/crawler/crawl-job',
        component: CrawlJobsPage,
        layout: 'admin',
        title: 'Crawl Jobs',
        label: 'Crawl Jobs',
        module: 'crawler',
        action: 'view',
        icon: RobotOutlined,
        order: 10,
    },
    {
        path: '/crawler/crawl-job/create',
        component: CrawlJobFormPage,
        layout: 'admin',
        module: 'crawler',
        action: 'create',
        title: 'Create Crawl Job',
    },
    {
        path: '/crawler/crawl-job/:id',
        component: CrawlJobDetailPage,
        layout: 'admin',
        module: 'crawler',
        action: 'view',
        title: 'Crawl Job Details',
    },
    {
        path: '/crawler/crawl-job/:id/edit',
        component: CrawlJobFormPage,
        layout: 'admin',
        module: 'crawler',
        action: 'edit',
        title: 'Edit Crawl Job',
    },
];

export default crawlerRoutes;