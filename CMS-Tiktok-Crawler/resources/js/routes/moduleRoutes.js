import CrawlJobRoute from '@modules/Crawler/assets/routes/route';
import TiktokAccountRoute from '@modules/TiktokAccount/assets/routes/route';

const moduleRoutes = [
	...CrawlJobRoute,
	...TiktokAccountRoute
];

export default moduleRoutes;