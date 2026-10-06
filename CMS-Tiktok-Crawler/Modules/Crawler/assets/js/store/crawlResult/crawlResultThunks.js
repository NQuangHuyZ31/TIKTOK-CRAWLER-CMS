import { createAsyncThunk } from "@reduxjs/toolkit";
import crawlResultAPI from "@modules/Crawler/assets/js/services/crawlResultAPI";

export const fetchCrawlResultsByCrawlJobID = createAsyncThunk(
	'crawlResult/fetchByCrawlJobID',
	async ({ id, params }, { rejectWithValue }) => {
		try {
			return await crawlResultAPI.getCrawlResultByCrawlJobID(id, params);
		} catch (error) {
			return rejectWithValue(error.response?.data?.message ?? error.message)
		}
	}
)