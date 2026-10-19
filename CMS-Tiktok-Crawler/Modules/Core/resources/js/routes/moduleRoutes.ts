import CrawlJobRoute from '../../../../Crawler/resources/js/routes/route';
import TiktokAccountRoute from '../../../../TiktokAccount/resources/js/routes/route';

const moduleRoutes = [
	...CrawlJobRoute,
	...TiktokAccountRoute
];

export default moduleRoutes;
