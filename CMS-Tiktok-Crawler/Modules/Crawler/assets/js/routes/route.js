import CrawlJobsPage from '@modules/Crawler/assets/js/pages/CrawlJobsPage';
import CrawlJobDetailPage from '@modules/Crawler/assets/js/pages/CrawlJobDetailPage';

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