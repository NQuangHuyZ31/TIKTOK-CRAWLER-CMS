import CrawlJobRoute from '@modules/Crawler/assets/js/routes/route';
import TiktokAccountRoute from '@modules/TiktokAccount/assets/js/routes/route';

const moduleRoutes = [
	...CrawlJobRoute,
	...TiktokAccountRoute
];

export default moduleRoutes;