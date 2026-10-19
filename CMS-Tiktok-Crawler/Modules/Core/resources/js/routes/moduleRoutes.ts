import CrawlJobRoute from '@modules/Crawler/resources/js/routes/route';
import TiktokAccountRoute from '@modules/TiktokAccount/resources/js/routes/route';

const moduleRoutes = [
	...CrawlJobRoute,
	...TiktokAccountRoute
];

export default moduleRoutes;
