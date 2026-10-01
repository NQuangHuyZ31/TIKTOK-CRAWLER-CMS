import CrawlJobsPage from '@modules/Crawler/assets/pages/CrawlJobsPage';
import CrawlJobDetailPage from '@modules/Crawler/assets/pages/CrawlJobDetailPage';

const crawlerRoutes = [
	{
		path: '/crawl-jobs',
		component: CrawlJobsPage
	},

	{
		path: '/crawl-jobs/:id',
		component: CrawlJobDetailPage
	}
];

export default crawlerRoutes;