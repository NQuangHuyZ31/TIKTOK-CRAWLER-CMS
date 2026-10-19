import CrawlJobsPage from '../pages/CrawlJobsPage';
import CreateCrawlJobPage from '../pages/CreateCrawlJobPage';
import CrawlJobDetailPage from '../pages/CrawlJobDetailPage';
import EditCrawlJobPage from '../pages/EditCrawlJobPage';

const crawlerRoutes = [
	{
		path: 'crawler/crawl-job',
		component: CrawlJobsPage
	},
	{
		path: '/crawler/crawl-job/create',
		component: CreateCrawlJobPage
	},
	{
		path: 'crawler/crawl-job/:id/edit',
		component: EditCrawlJobPage
	},

	{
		path: 'crawler/crawl-job/:id',
		component: CrawlJobDetailPage
	}
];

export default crawlerRoutes;