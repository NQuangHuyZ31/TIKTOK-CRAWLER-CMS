import { createAsyncThunk } from "@reduxjs/toolkit";
import crawlJobAPI from "../../Action/crawlJob";

/**
 * Thunk lấy danh sách crawl jobs theo params (phân trang, filter, search).
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
 * Thunk lấy dữ liệu thống kê tổng hợp (KPI cards).
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
