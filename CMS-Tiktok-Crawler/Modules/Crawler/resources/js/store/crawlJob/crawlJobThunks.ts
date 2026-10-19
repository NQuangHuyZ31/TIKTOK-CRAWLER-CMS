import { createAsyncThunk } from "@reduxjs/toolkit";
import crawlJobAPI from "../../Action/crawlJob";

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

export const fetchCrawlJobById = createAsyncThunk<any, any>(
	'crawlJob/fetchById',
	async (id: any, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.getCrawlJobByID(id);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const createCrawlJob = createAsyncThunk<any, any>(
	'crawlJob/create',
	async (data: any, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.createCrawlJob(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const updateCrawlJob = createAsyncThunk<any, { id: any; data: any }>(
	'crawlJob/update',
	async ({ id, data }: any, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.updateCrawlJob(id, data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

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

export const deleteCrawlJobById = createAsyncThunk<any, any>(
	'crawlJob/deleteById',
	async (id: any, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.deleteCrawlJobByID(id);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const startCrawlJobById = createAsyncThunk<any, any>(
	'crawlJob/startById',
	async (id: any, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.startCrawlJobByID(id);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const getCrawlJobResults = createAsyncThunk<any, { id: any; params?: any }>(
	'crawlJob/getResults',
	async ({ id, params }: any, { rejectWithValue }: any) => {
		try {
			return await crawlJobAPI.getResults(id, params);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);
