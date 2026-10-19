import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
	fetchCrawlJobs,
	fetchCrawlJobById,
	createCrawlJob,
	fetchStatisticsSummary,
	deleteCrawlJobById,
	startCrawlJobById,
	getCrawlJobResults
} from "@modules/Crawler/resources/js/store/crawlJob/crawlJobThunks";

export interface CrawlJobState {
	data: any[];
	results: any[];
	currentJob: any;
	statistics: any;
	loading: boolean;
	loadingDeleted: boolean;
	open: boolean;
	crawlResultsLoading: boolean;
	crawlResultsError: any;
	startLoaing: boolean;
	StartError: any;
	error: any;
	statisticsLoading: boolean;
	statisticsError: any;
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
}

const initialState: CrawlJobState = {
	data: [],
	results: [],
	currentJob: null,
	statistics: null,
	loading: false,
	loadingDeleted: false,
	open: false,
	crawlResultsLoading: false,
	crawlResultsError: null,
	startLoaing: false,
	StartError: null,
	error: null,
	statisticsLoading: false,
	statisticsError: null,
	pagination: {
		page: 1,
		per_page: 5,
		total: 0,
	},
	params: {
		page: 1,
		per_page: 5,
	}
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
		closeDeleteModal: (state) => {
			state.open = false;
		}
	},
	extraReducers: (builder) => {
		// Fetch all crawl jobs
		builder
			.addCase(fetchCrawlJobs.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCrawlJobs.fulfilled, (state, action) => {
				state.loading = false;
				const res = action.payload;

				state.data = res?.data ?? [];
				state.pagination = {
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				};
			})
			.addCase(fetchCrawlJobs.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Failed to fetch crawl jobs';
			});

		// Fetch crawl job by ID
		builder
			.addCase(fetchCrawlJobById.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCrawlJobById.fulfilled, (state, action) => {
				state.loading = false;
				const res = action.payload;
				state.currentJob = res?.data ?? action.payload;
			})
			.addCase(fetchCrawlJobById.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Failed to fetch crawl job by ID';
			});

		// Create crawl job
		builder
			.addCase(createCrawlJob.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createCrawlJob.fulfilled, (state, action) => {
				state.loading = false;
				const res = action.payload;
				state.currentJob = res?.data ?? action.payload;
			})
			.addCase(createCrawlJob.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Failed to create crawl job';
			});

		// Fetch statistics summary
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
				state.statisticsError = action.payload ?? 'Failed to fetch statistics summary';
			});

		// Delete crawl job by ID
		builder
			.addCase(deleteCrawlJobById.pending, (state) => {
				state.loadingDeleted = true;
				state.error = null;
			})
			.addCase(deleteCrawlJobById.fulfilled, (state, action) => {
				state.loadingDeleted = false;
				state.open = false;

				const deletedJob = state.data.find(
					(job) => job.id === action.meta.arg
				);

				state.data = state.data.filter(
					(job) => job.id !== action.meta.arg
				);

				state.pagination.total = Math.max((state.pagination.total ?? 0) - 1, 0);

				if (state.statistics && deletedJob) {
					state.statistics.total_jobs = Math.max((state.statistics.total_jobs ?? 0) - 1, 0);

					if (deletedJob.status === 'completed') {
						state.statistics.total_completed_jobs = Math.max((state.statistics.total_completed_jobs ?? 0) - 1, 0);
					}

					if (deletedJob.status === 'failed') {
						state.statistics.total_failed_jobs = Math.max((state.statistics.total_failed_jobs ?? 0) - 1, 0);
					}

					state.statistics.total_accounts = Math.max((state.statistics.total_accounts ?? 0) - (deletedJob.total_account ?? 0), 0);
					state.statistics.total_success_accounts = Math.max((state.statistics.total_success_accounts ?? 0) - (deletedJob.success_count ?? 0), 0);
					state.statistics.total_failed_accounts = Math.max((state.statistics.total_failed_accounts ?? 0) - (deletedJob.failed_count ?? 0), 0);
				}
			})
			.addCase(deleteCrawlJobById.rejected, (state, action) => {
				state.loadingDeleted = false;
				state.error = action.payload ?? 'Failed to delete crawl job';
			});

		// Start crawl job by ID
		builder
			.addCase(startCrawlJobById.pending, (state) => {
				state.startLoaing = true;
				state.StartError = null;
			})
			.addCase(startCrawlJobById.fulfilled, (state, action) => {
				state.startLoaing = false;
				const res = action.payload;
				state.currentJob = res?.data ?? action.payload;
			})
			.addCase(startCrawlJobById.rejected, (state, action) => {
				state.startLoaing = false;
				state.StartError = action.payload ?? 'Failed to start crawl job';
			});

		// Get crawl job results by ID
		builder
			.addCase(getCrawlJobResults.pending, (state) => {
				state.crawlResultsLoading = true;
				state.crawlResultsError = null;
			})
			.addCase(getCrawlJobResults.fulfilled, (state, action) => {
				state.crawlResultsLoading = false;
				const res = action.payload;
				state.results = res?.data ?? action.payload;

				state.pagination = {
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				};
			})
			.addCase(getCrawlJobResults.rejected, (state, action) => {
				state.crawlResultsLoading = false;
				state.crawlResultsError = action.payload ?? 'Failed to fetch crawl job results';
			});
	}
});

export const { setParams, resetParams, closeDeleteModal } = crawlJobSlice.actions;
export default crawlJobSlice.reducer;
