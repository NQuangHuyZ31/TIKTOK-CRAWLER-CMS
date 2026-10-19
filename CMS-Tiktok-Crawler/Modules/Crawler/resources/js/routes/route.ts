import CrawlJobsPage from '@modules/Crawler/resources/js/pages/CrawlJobsPage';
import CreateCrawlJobPage from '@modules/Crawler/resources/js/pages/CreateCrawlJobPage';
import CrawlJobDetailPage from '@modules/Crawler/resources/js/pages/CrawlJobDetailPage';
import EditCrawlJobPage from '@modules/Crawler/resources/js/pages/EditCrawlJobPage';

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