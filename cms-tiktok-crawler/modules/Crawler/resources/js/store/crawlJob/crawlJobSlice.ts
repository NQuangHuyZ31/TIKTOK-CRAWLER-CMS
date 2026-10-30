import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchCrawlJobs, fetchStatisticsSummary } from "./crawlJobThunks";

export interface CrawlJobState {
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
				state.data = res?.data ?? [];
				state.pagination = {
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				};
			})
			.addCase(fetchCrawlJobs.rejected, (state, action) => {
				state.loading = false;
				state.error = (action.payload as string) ?? 'Failed to fetch crawl jobs';
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
				state.statisticsError = (action.payload as string) ?? 'Failed to fetch statistics summary';
			});
	},
});

export const { setParams, resetParams } = crawlJobSlice.actions;
export default crawlJobSlice.reducer;
