import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
	fetchCrawlJobs,
	fetchCrawlJobDetail,
	fetchJobResults,
	fetchJobVideoResults,
	fetchStatisticsSummary,
} from "./crawlJobThunks";

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

const initialState: CrawlJobState = {
	data: [],
	loading: false,
	error: null,
	statistics: null,
	statisticsLoading: false,
	statisticsError: null,
	pagination: {
		page: 1,
		per_page: 10,
		total: 0,
	},
	params: {
		page: 1,
		per_page: 10,
	},

	currentJob: null,
	currentJobLoading: false,
	currentJobError: null,

	jobResults: [],
	jobResultsLoading: false,
	jobResultsPagination: {
		page: 1,
		per_page: 10,
		total: 0,
	},
	jobResultsParams: {
		page: 1,
		per_page: 10,
	},

	jobVideoResults: [],
	jobVideoResultsLoading: false,
	jobVideoResultsPagination: {
		page: 1,
		per_page: 10,
		total: 0,
	},
	jobVideoResultsParams: {
		page: 1,
		per_page: 10,
	},
};

const crawlJobSlice = createSlice({
	name: 'crawlJob',
	initialState,
	reducers: {
		setParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.params = { ...state.params, ...action.payload };
		},
		resetParams: (state) => {
			state.params = {
				page: 1,
				per_page: 10,
			};
		},
		setJobResultsParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.jobResultsParams = { ...state.jobResultsParams, ...action.payload };
		},
		resetJobResultsParams: (state) => {
			state.jobResultsParams = {
				page: 1,
				per_page: 10,
			};
		},
		setJobVideoResultsParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.jobVideoResultsParams = { ...state.jobVideoResultsParams, ...action.payload };
		},
		resetJobVideoResultsParams: (state) => {
			state.jobVideoResultsParams = {
				page: 1,
				per_page: 10,
			};
		},
		clearCurrentJobDetail: (state) => {
			state.currentJob = null;
			state.currentJobLoading = false;
			state.currentJobError = null;
			state.jobResults = [];
			state.jobResultsPagination = { page: 1, per_page: 10, total: 0 };
			state.jobVideoResults = [];
			state.jobVideoResultsPagination = { page: 1, per_page: 10, total: 0 };
		},
	},
	extraReducers: (builder) => {
		// 1. Fetch all crawl jobs
		builder
			.addCase(fetchCrawlJobs.pending, (state, action) => {
				if (!action.meta.arg?.silent) {
					state.loading = true;
				}
				state.error = null;
			})
			.addCase(fetchCrawlJobs.fulfilled, (state, action) => {
				state.loading = false;
				const res = action.payload;
				state.data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
				state.pagination = {
					page: res?.meta?.current_page ?? res?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? res?.per_page ?? 10,
					total: res?.meta?.total ?? res?.total ?? state.data.length,
				};
			})
			.addCase(fetchCrawlJobs.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// 2. Fetch statistics summary
		builder
			.addCase(fetchStatisticsSummary.pending, (state) => {
				state.statisticsLoading = true;
				state.statisticsError = null;
			})
			.addCase(fetchStatisticsSummary.fulfilled, (state, action) => {
				state.statisticsLoading = false;
				state.statistics = action.payload?.data ?? action.payload;
			})
			.addCase(fetchStatisticsSummary.rejected, (state, action) => {
				state.statisticsLoading = false;
				state.statisticsError = action.payload as string;
			});

		// 3. Fetch crawl job detail
		builder
			.addCase(fetchCrawlJobDetail.pending, (state, action) => {
				if (!action.meta.arg?.silent) {
					state.currentJobLoading = true;
				}
				state.currentJobError = null;
			})
			.addCase(fetchCrawlJobDetail.fulfilled, (state, action) => {
				state.currentJobLoading = false;
				state.currentJob = action.payload;
			})
			.addCase(fetchCrawlJobDetail.rejected, (state, action) => {
				state.currentJobLoading = false;
				state.currentJobError = action.payload as string;
			});

		// 4. Fetch job account results
		builder
			.addCase(fetchJobResults.pending, (state, action) => {
				if (!action.meta.arg?.silent) {
					state.jobResultsLoading = true;
				}
			})
			.addCase(fetchJobResults.fulfilled, (state, action) => {
				state.jobResultsLoading = false;
				const res = action.payload;
				const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
				state.jobResults = items;
				state.jobResultsPagination = {
					page: res?.meta?.current_page ?? res?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? res?.per_page ?? 10,
					total: res?.meta?.total ?? res?.total ?? items.length,
				};
			})
			.addCase(fetchJobResults.rejected, (state) => {
				state.jobResultsLoading = false;
			});

		// 5. Fetch job video results
		builder
			.addCase(fetchJobVideoResults.pending, (state, action) => {
				if (!action.meta.arg?.silent) {
					state.jobVideoResultsLoading = true;
				}
			})
			.addCase(fetchJobVideoResults.fulfilled, (state, action) => {
				state.jobVideoResultsLoading = false;
				const res = action.payload;
				const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
				state.jobVideoResults = items;
				state.jobVideoResultsPagination = {
					page: res?.meta?.current_page ?? res?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? res?.per_page ?? 10,
					total: res?.meta?.total ?? res?.total ?? items.length,
				};
			})
			.addCase(fetchJobVideoResults.rejected, (state) => {
				state.jobVideoResultsLoading = false;
			});
	},
});

export const {
	setParams,
	resetParams,
	setJobResultsParams,
	resetJobResultsParams,
	setJobVideoResultsParams,
	resetJobVideoResultsParams,
	clearCurrentJobDetail,
} = crawlJobSlice.actions;

export default crawlJobSlice.reducer;
