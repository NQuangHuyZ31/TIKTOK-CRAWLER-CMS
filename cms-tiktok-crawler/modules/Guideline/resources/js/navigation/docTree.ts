import type { DocArticle, NavPillarGroup } from '../types/docSchema';
import type { DocLanguage } from '../context/DocLanguageContext';
import { LEARN_ARTICLES } from '../content/learnArticles';
import { FOLLOW_ARTICLES } from '../content/followArticles';
import { LEARN_ARTICLES_VI } from '../content/learnArticlesVi';
import { FOLLOW_ARTICLES_VI } from '../content/followArticlesVi';

export const ALL_DOC_ARTICLES_EN: DocArticle[] = [...LEARN_ARTICLES, ...FOLLOW_ARTICLES];
export const ALL_DOC_ARTICLES_VI: DocArticle[] = [...LEARN_ARTICLES_VI, ...FOLLOW_ARTICLES_VI];

export const DOCUMENTATION_NAV_TREE_EN: NavPillarGroup[] = [
	{
		pillar: 'learn',
		title: 'LEARN (KNOWLEDGE & ARCHITECTURE)',
		groups: [
			{
				category: 'System Foundations',
				items: [
					{ title: 'System Overview & Topology', slug: 'system-overview', pillar: 'learn' },
					{ title: 'Core Concepts & Terminology', slug: 'core-concepts', pillar: 'learn' },
				],
			},
			{
				category: 'Module Architecture',
				items: [
					{ title: 'Crawler Module Architecture', slug: 'crawler-module-architecture', pillar: 'learn' },
					{ title: 'TikTok Accounts Architecture', slug: 'tiktok-account-architecture', pillar: 'learn' },
					{ title: 'User Management Architecture', slug: 'user-management-architecture', pillar: 'learn' },
					{ title: 'Roles & Permissions Architecture', slug: 'roles-permissions-architecture', pillar: 'learn' },
					{ title: 'System & Diagnostics Architecture', slug: 'system-diagnostics-architecture', pillar: 'learn' },
				],
			},
		],
	},
	{
		pillar: 'follow',
		title: 'FOLLOW (GUIDES & SOPS)',
		groups: [
			{
				category: 'Getting Started',
				items: [
					{ title: '5-Minute Quick Start Guide', slug: 'quickstart', pillar: 'follow' },
					{ title: 'Authentication & Security Access SOP', slug: 'auth-security-sop', pillar: 'follow' },
				],
			},
			{
				category: 'Operational SOPs',
				items: [
					{ title: 'Dashboard & Health Monitoring SOP', slug: 'dashboard-sop', pillar: 'follow' },
					{ title: 'Crawl Jobs Operations SOP', slug: 'crawler-operations-sop', pillar: 'follow' },
					{ title: 'TikTok Accounts & Video SOP', slug: 'tiktok-account-sop', pillar: 'follow' },
					{ title: 'User Management SOP', slug: 'user-management-sop', pillar: 'follow' },
					{ title: 'Roles & Permissions SOP', slug: 'roles-permissions-sop', pillar: 'follow' },
					{ title: 'System Settings & Diagnostics SOP', slug: 'system-diagnostics-sop', pillar: 'follow' },
				],
			},
		],
	},
];

export const DOCUMENTATION_NAV_TREE_VI: NavPillarGroup[] = [
	{
		pillar: 'learn',
		title: 'KIẾN THỨC & NGUYÊN LÝ (LEARN)',
		groups: [
			{
				category: 'Nền tảng hệ thống',
				items: [
					{ title: 'Tổng quan Hệ thống & Topology', slug: 'system-overview', pillar: 'learn' },
					{ title: 'Khái niệm & Thuật ngữ Cốt lõi', slug: 'core-concepts', pillar: 'learn' },
				],
			},
			{
				category: 'Kiến trúc Module',
				items: [
					{ title: 'Kiến trúc Module Crawler', slug: 'crawler-module-architecture', pillar: 'learn' },
					{ title: 'Kiến trúc Module TikTok Accounts', slug: 'tiktok-account-architecture', pillar: 'learn' },
					{ title: 'Kiến trúc Module Quản lý Người dùng', slug: 'user-management-architecture', pillar: 'learn' },
					{ title: 'Kiến trúc Module Roles & Permissions', slug: 'roles-permissions-architecture', pillar: 'learn' },
					{ title: 'Kiến trúc Module Hệ thống & Chẩn đoán', slug: 'system-diagnostics-architecture', pillar: 'learn' },
				],
			},
		],
	},
	{
		pillar: 'follow',
		title: 'HƯỚNG DẪN & QUY TRÌNH (FOLLOW)',
		groups: [
			{
				category: 'Bắt đầu nhanh',
				items: [
					{ title: 'Hướng dẫn bắt đầu nhanh trong 5 phút', slug: 'quickstart', pillar: 'follow' },
					{ title: 'SOP Xác thực & Bảo mật Truy cập', slug: 'auth-security-sop', pillar: 'follow' },
				],
			},
			{
				category: 'SOP Vận hành Tác vụ',
				items: [
					{ title: 'SOP Theo dõi Dashboard & Trạng thái', slug: 'dashboard-sop', pillar: 'follow' },
					{ title: 'SOP Vận hành Module Crawler', slug: 'crawler-operations-sop', pillar: 'follow' },
					{ title: 'SOP Quản lý Kênh TikTok & Video', slug: 'tiktok-account-sop', pillar: 'follow' },
					{ title: 'SOP Quản lý Người dùng & Nhân sự', slug: 'user-management-sop', pillar: 'follow' },
					{ title: 'SOP Thiết lập Vai trò & Phân quyền', slug: 'roles-permissions-sop', pillar: 'follow' },
					{ title: 'SOP Cấu hình & Chẩn đoán Hệ thống', slug: 'system-diagnostics-sop', pillar: 'follow' },
				],
			},
		],
	},
];

export function getNavigationTree(language: DocLanguage = 'en'): NavPillarGroup[] {
	return language === 'vi' ? DOCUMENTATION_NAV_TREE_VI : DOCUMENTATION_NAV_TREE_EN;
}

export function getAllArticles(language: DocLanguage = 'en'): DocArticle[] {
	return language === 'vi' ? ALL_DOC_ARTICLES_VI : ALL_DOC_ARTICLES_EN;
}

export function findArticleBySlug(pillar: string, slug: string, language: DocLanguage = 'en'): DocArticle | undefined {
	const articles = getAllArticles(language);
	return articles.find((a) => a.pillar === pillar && a.slug === slug);
}

export function searchDocumentation(
	query: string,
	language: DocLanguage = 'en',
): {
	learnResults: DocArticle[];
	followResults: DocArticle[];
} {
	const q = query.toLowerCase().trim();
	if (!q) {
		return { learnResults: [], followResults: [] };
	}

	const learnArticles = language === 'vi' ? LEARN_ARTICLES_VI : LEARN_ARTICLES;
	const followArticles = language === 'vi' ? FOLLOW_ARTICLES_VI : FOLLOW_ARTICLES;

	const matches = (a: DocArticle) => {
		if (a.title.toLowerCase().includes(q)) return true;
		if (a.subtitle.toLowerCase().includes(q)) return true;
		if (a.category.toLowerCase().includes(q)) return true;
		return a.blocks.some((b) => {
			if (b.type === 'heading' && b.text.toLowerCase().includes(q)) return true;
			if (b.type === 'paragraph' && b.text.toLowerCase().includes(q)) return true;
			if (b.type === 'procedure' && b.steps.some((s) => s.title.toLowerCase().includes(q) || s.instruction.toLowerCase().includes(q))) return true;
			return false;
		});
	};

	return {
		learnResults: learnArticles.filter(matches),
		followResults: followArticles.filter(matches),
	};
}
