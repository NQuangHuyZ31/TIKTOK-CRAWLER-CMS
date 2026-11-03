import { createAsyncThunk } from "@reduxjs/toolkit";
import crawlJobAPI from "../../Action/crawlJob";

/**
 * Thunk to fetch crawl jobs with params (pagination, filter, search).
 */
export const fetchCrawlJobs = createAsyncThunk<any, any>(
	'crawlJob/fetchAll',
	async (params: any, { rejectWithValue }: any) => {
		try {
			const { silent: _silent, ...queryParams } = params ?? {};
			return await crawlJobAPI.getCrawlJobs(queryParams);
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

/**
 * Thunk to fetch crawl job details by ID.
 */
export const fetchCrawlJobDetail = createAsyncThunk<any, { id: string | number; silent?: boolean }>(
	'crawlJob/fetchDetail',
	async ({ id }, { rejectWithValue }: any) => {
		try {
			const res = await crawlJobAPI.getCrawlJobByID(id);
			return res?.data ?? res;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message ?? 'Failed to load crawl job details');
		}
	}
);

/**
 * Thunk to fetch account results of a specific crawl job.
 */
export const fetchJobResults = createAsyncThunk<any, { id: string | number; params?: Record<string, any>; silent?: boolean }>(
	'crawlJob/fetchResults',
	async ({ id, params }, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.getResults(id, params ?? {});
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message ?? 'Failed to load crawl results');
		}
	}
);

/**
 * Thunk to fetch video results of a specific crawl job.
 */
export const fetchJobVideoResults = createAsyncThunk<any, { id: string | number; params?: Record<string, any>; silent?: boolean }>(
	'crawlJob/fetchVideoResults',
	async ({ id, params }, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.getVideoResults(id, params ?? {});
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message ?? 'Failed to load video results');
		}
	}
);
