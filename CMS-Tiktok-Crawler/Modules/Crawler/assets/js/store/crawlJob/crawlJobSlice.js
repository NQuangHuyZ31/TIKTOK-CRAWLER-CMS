import { createSlice } from "@reduxjs/toolkit";
import { fetchCrawlJobs, fetchCrawlJobById, createCrawlJob, fetchStatisticsSummary, deleteCrawlJobById }
	from "@modules/Crawler/assets/js/store/crawlJob/crawlJobThunks";

const initialState = {
	data: [],
	currentJob: null,
	statistics: null,
	loading: false,
	loadingDeleted: false,
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
	initialState,
	name: 'crawlJob',
	reducers: {
		setParams: (state, action) => {
			state.params = { ...state.params, ...action.payload };
		},

		resetParams: (state) => {
			state.params = {
				page: 1,
				per_page: 10,
			};
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
			})

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
			})

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
			})

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
			})

		// Delete crawl job by ID
		builder
			.addCase(deleteCrawlJobById.pending, (state) => {
				state.loadingDeleted = true;
				state.error = null;
			})

			.addCase(deleteCrawlJobById.fulfilled, (state, action) => {
				state.loadingDeleted = false;
				state.open = false;
			})

			.addCase(deleteCrawlJobById.rejected, (state, action) => {
				state.loadingDeleted = false;
				state.error = action.payload ?? 'Failed to delete crawl job';
			})
	}
});

export const { setParams, resetParams, closeDeleteModal } = crawlJobSlice.actions;
export default crawlJobSlice.reducer;