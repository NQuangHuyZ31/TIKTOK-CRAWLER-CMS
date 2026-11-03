export interface CrawlJobState {
	// Job listing
	data: any[];
	loading: boolean;
	error: string | null;
	statistics: any;
	statisticsLoading: boolean;
	statisticsError: string | null;
	pagination: {
		page: number;
		per_page: number;
		total: number;
	};
	params: {
		page: number;
		per_page: number;
		[key: string]: any;
	};

	// Job detail
	currentJob: any | null;
	currentJobLoading: boolean;
	currentJobError: string | null;

	// Account results
	jobResults: any[];
	jobResultsLoading: boolean;
	jobResultsPagination: {
		page: number;
		per_page: number;
		total: number;
	};
	jobResultsParams: {
		page: number;
		per_page: number;
		[key: string]: any;
	};

	// Video results
	jobVideoResults: any[];
	jobVideoResultsLoading: boolean;
	jobVideoResultsPagination: {
		page: number;
		per_page: number;
		total: number;
	};
	jobVideoResultsParams: {
		page: number;
		per_page: number;
		[key: string]: any;
	};
}

export const initialCrawlJobState: CrawlJobState = {
	data: [],
	loading: false,
	error: null,
	statistics: null,
	statisticsLoading: false,
	statisticsError: null,
	pagination: { page: 1, per_page: 10, total: 0 },
	params: { page: 1, per_page: 10 },

	currentJob: null,
	currentJobLoading: false,
	currentJobError: null,

	jobResults: [],
	jobResultsLoading: false,
	jobResultsPagination: { page: 1, per_page: 10, total: 0 },
	jobResultsParams: { page: 1, per_page: 10 },

	jobVideoResults: [],
	jobVideoResultsLoading: false,
	jobVideoResultsPagination: { page: 1, per_page: 10, total: 0 },
	jobVideoResultsParams: { page: 1, per_page: 10 },
};

export function extractPaginatedData(res: any) {
	const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
	return {
		items,
		pagination: {
			page: res?.meta?.current_page ?? res?.current_page ?? 1,
			per_page: res?.meta?.per_page ?? res?.per_page ?? 10,
			total: res?.meta?.total ?? res?.total ?? items.length,
		},
	};
}
