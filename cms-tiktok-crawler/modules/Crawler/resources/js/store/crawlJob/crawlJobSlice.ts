import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
	fetchCrawlJobs,
	fetchCrawlJobDetail,
	fetchJobResults,
	fetchJobVideoResults,
	fetchStatisticsSummary,
} from "./crawlJobThunks";
import {
	CrawlJobState,
	initialCrawlJobState,
	extractPaginatedData,
} from "./crawlJobSliceTypes";

export type { CrawlJobState };
const initialState = initialCrawlJobState;

const crawlJobSlice = createSlice({
	name: 'crawlJob',
	initialState,
	reducers: {
		setParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.params = { ...state.params, ...action.payload };
		},
		resetParams: (state) => {
			state.params = { page: 1, per_page: 10 };
		},
		setJobResultsParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.jobResultsParams = { ...state.jobResultsParams, ...action.payload };
		},
		resetJobResultsParams: (state) => {
			state.jobResultsParams = { page: 1, per_page: 10 };
		},
		setJobVideoResultsParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.jobVideoResultsParams = { ...state.jobVideoResultsParams, ...action.payload };
		},
		resetJobVideoResultsParams: (state) => {
			state.jobVideoResultsParams = { page: 1, per_page: 10 };
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
				if (!action.meta.arg?.silent) state.loading = true;
				state.error = null;
			})
			.addCase(fetchCrawlJobs.fulfilled, (state, action) => {
				state.loading = false;
				const { items, pagination } = extractPaginatedData(action.payload);
				state.data = items;
				state.pagination = pagination;
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
				if (!action.meta.arg?.silent) state.currentJobLoading = true;
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
				if (!action.meta.arg?.silent) state.jobResultsLoading = true;
			})
			.addCase(fetchJobResults.fulfilled, (state, action) => {
				state.jobResultsLoading = false;
				const { items, pagination } = extractPaginatedData(action.payload);
				state.jobResults = items;
				state.jobResultsPagination = pagination;
			})
			.addCase(fetchJobResults.rejected, (state) => {
				state.jobResultsLoading = false;
			});

		// 5. Fetch job video results
		builder
			.addCase(fetchJobVideoResults.pending, (state, action) => {
				if (!action.meta.arg?.silent) state.jobVideoResultsLoading = true;
			})
			.addCase(fetchJobVideoResults.fulfilled, (state, action) => {
				state.jobVideoResultsLoading = false;
				const { items, pagination } = extractPaginatedData(action.payload);
				state.jobVideoResults = items;
				state.jobVideoResultsPagination = pagination;
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
