export type DocPillar = 'learn' | 'follow';

export interface DocScreenshot {
	src?: string;
	alt: string;
	caption: string;
	location: string;
	targetArea: string;
	captureInstruction: string;
}

export interface DocProcedureStep {
	stepNumber: number;
	title: string;
	instruction: string;
	screenshot?: DocScreenshot;
	fields?: {
		name: string;
		required: boolean;
		description: string;
	}[];
	expectedResult?: string;
	actionUrl?: string;
	actionLabel?: string;
}

export type DocBlock =
	| { type: 'heading'; level: 2 | 3; text: string; anchorId: string }
	| { type: 'paragraph'; text: string }
	| { type: 'callout'; variant: 'note' | 'tip' | 'warning' | 'important'; title?: string; text: string }
	| { type: 'procedure'; title?: string; steps: DocProcedureStep[] }
	| { type: 'image'; screenshot: DocScreenshot }
	| { type: 'code'; language: string; code: string; title?: string }
	| { type: 'table'; headers: string[]; rows: string[][] }
	| { type: 'list'; ordered?: boolean; items: string[] };

export interface DocArticle {
	id: string;
	slug: string;
	pillar: DocPillar;
	category: string;
	title: string;
	subtitle: string;
	duration?: string;
	breadcrumbs: {
		label: string;
		url?: string;
	}[];
	blocks: DocBlock[];
	prevArticle?: {
		pillar: DocPillar;
		slug: string;
		title: string;
	};
	nextArticle?: {
		pillar: DocPillar;
		slug: string;
		title: string;
	};
}

export interface NavTreeItem {
	title: string;
	slug: string;
	pillar: DocPillar;
}

export interface NavCategoryGroup {
	category: string;
	items: NavTreeItem[];
}

export interface NavPillarGroup {
	pillar: DocPillar;
	title: string;
	groups: NavCategoryGroup[];
}
