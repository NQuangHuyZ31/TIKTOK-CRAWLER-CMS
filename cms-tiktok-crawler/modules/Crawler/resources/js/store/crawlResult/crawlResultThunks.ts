// import { createAsyncThunk } from "@reduxjs/toolkit";
// import crawlResultAPI from "@modules/Crawler/resources/js/Action/crawlResult";

// export const fetchCrawlResultsByCrawlJobID = createAsyncThunk(
// 	'crawlResult/fetchByCrawlJobID',
// 	async ({ id, params }, { rejectWithValue }) => {
// 		try {
// 			return await crawlResultAPI.getCrawlResultByCrawlJobID(id, params);
// 		} catch (error) {
// 			return rejectWithValue(error.response?.data?.message ?? error.message)
// 		}
// 	}
// )

// export const fetchCrawlResultsByAccountID = createAsyncThunk(
// 	'crawlResult/fetchByAccountID',
// 	async ({ id, params }, { rejectWithValue }) => {
// 		try {
// 			return await crawlResultAPI.getCrawlResultByAccountID(id, params);
// 		} catch (error) {
// 			return rejectWithValue(error.response?.data?.message ?? error.message)
// 		}
// 	}
// )