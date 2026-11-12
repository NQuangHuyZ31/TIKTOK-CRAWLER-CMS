import type { RouteDef } from '@core/routes/registry';
import GuidelineHomePage from '../pages/GuidelineHomePage';
import GuidelineArticlePage from '../pages/GuidelineArticlePage';

const guidelineRoutes: RouteDef[] = [
	{
		path: '/guideline',
		component: GuidelineHomePage,
		layout: 'bare',
		isPrivate: true,
		guestOnly: false,
		module: 'guideline',
		title: 'System Guidelines & Documentation',
		order: 998,
	},
	{
		path: '/guideline/:pillar/:slug',
		component: GuidelineArticlePage,
		layout: 'bare',
		isPrivate: true,
		guestOnly: false,
		module: 'guideline',
		title: 'Documentation Article - System Guidelines',
		order: 999,
	},
];

export default guidelineRoutes;
