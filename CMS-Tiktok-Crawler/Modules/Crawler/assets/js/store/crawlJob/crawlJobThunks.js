import { createAsyncThunk } from "@reduxjs/toolkit";
import crawlJobAPI from "@modules/Crawler/assets/js/services/crawlJobAPI";


export const fetchCrawlJobs = createAsyncThunk(
	'crawlJob/fetchAll',
	async (params, { rejectWithValue }) => {
		try {
			return await crawlJobAPI.getCrawlJobs(params);
		} catch (error) {
			return rejectWithValue(error.response?.data?.message ?? error.message)
		}
	}
)

export const fetchCrawlJobById = createAsyncThunk(
	'crawlJob/fetchById',
	async (id, { rejectWithValue }) => {
		try {
			return await crawlJobAPI.getCrawlJobbyID(id);
		} catch (error) {
			return rejectWithValue(error.response?.data?.message ?? error.message)
		}
	}
)

export const createCrawlJob = createAsyncThunk(
	'crawlJob/create',
	async (data, { rejectWithValue }) => {
		try {
			return await crawlJobAPI.createCrawlJob(data);
		} catch (error) {
			return rejectWithValue(error.response?.data?.message ?? error.message)
		}
	}
)

export const fetchStatisticsSummary = createAsyncThunk(
	'crawlJob/fetchStatisticsSummary',
	async (_, { rejectWithValue }) => {
		try {
			return await crawlJobAPI.getStatisticsSummary();
		} catch (error) {
			return rejectWithValue(error.response?.data?.message ?? error.message)
		}
	}
)

export const deleteCrawlJobById = createAsyncThunk(
	'crawlJob/deleteById',
	async (id, { rejectWithValue }) => {
		try {
			return await crawlJobAPI.deleteCrawlJobByID(id);
		} catch (error) {
			return rejectWithValue(error.response?.data?.message ?? error.message)
		}
	}
)

