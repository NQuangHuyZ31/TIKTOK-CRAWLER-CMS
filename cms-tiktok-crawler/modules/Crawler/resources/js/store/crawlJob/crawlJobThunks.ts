import { createAsyncThunk } from "@reduxjs/toolkit";
import crawlJobAPI from "../../Action/crawlJob";

/**
 * Thunk to fetch crawl jobs with params (pagination, filter, search).
 */
export const fetchCrawlJobs = createAsyncThunk<any, any>(
	'crawlJob/fetchAll',
	async (params: any, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.getCrawlJobs(params);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

/**
 * Thunk to fetch statistics summary (KPI cards).
 */
export const fetchStatisticsSummary = createAsyncThunk<any, void | undefined>(
	'crawlJob/fetchStatisticsSummary',
	async (_: any, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.getStatisticsSummary();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);
