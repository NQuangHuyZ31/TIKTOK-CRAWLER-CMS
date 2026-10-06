import { createSlice } from "@reduxjs/toolkit";
import { fetchCrawlResultsByCrawlJobID } from "@modules/Crawler/assets/js/store/crawlResult/crawlResultThunks";

const initialState = {
	data: [],
	loading: false,
	error: null,
	pagination: {
		page: 1,
		per_page: 5,
	},

	params: {
		page: 1,
		per_page: 5,
	}
}

const crawlResultSlice = createSlice({
	initialState,
	name: 'crawlResult',
	reducers: {
		setParams: (state, action) => {
			state.params = { ...state.params, ...action.payload };
		},
	},

	extraReducers: (builder) => {
		// get crawl results by crawl job ID
		builder
			.addCase(fetchCrawlResultsByCrawlJobID.pending, (state) => {
				state.loading = true;
				state.error = null;
			})

			.addCase(fetchCrawlResultsByCrawlJobID.fulfilled, (state, action) => {
				state.loading = false;
				const res = action.payload;
				state.data = res?.data ?? [];
				state.pagination = {
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				};
			})

			.addCase(fetchCrawlResultsByCrawlJobID.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Failed to fetch crawl results';
			})
	}
})

export const { setParams } = crawlResultSlice.actions;
export default crawlResultSlice.reducer;