import { createAsyncThunk } from "@reduxjs/toolkit";
import tiktokAccountAPI from "../../Action/tiktokAccount";

export const fechAllTiktokAccounts = createAsyncThunk<any, any>(
	'tiktokAccount/fetchAllTiktokAccounts',
	async (params: any, { rejectWithValue }: any) => {
		try {
			return await tiktokAccountAPI.getAllTiktokAccounts(params);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const fetchTiktokAccountByID = createAsyncThunk<any, any>(
	'tiktokAccount/fetchTiktokAccountByID',
	async (id: any, { rejectWithValue }: any) => {
		try {
			return await tiktokAccountAPI.getTiktokAccountByID(id);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const deleteTiktokAccount = createAsyncThunk<any, any>(
	'tiktokAccount/deleteTiktokAccount',
	async (id: any, { rejectWithValue }: any) => {
		try {
			return await tiktokAccountAPI.deleteTiktokAccount(id);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const fetchStatisticSummary = createAsyncThunk<any, void | undefined>(
	'tiktokAccount/fetchStatisticSummary',
	async (_: any, { rejectWithValue }: any) => {
		try {
			return await tiktokAccountAPI.getStatisticSummary();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const updateTiktokAccountStatus = createAsyncThunk<any, { id: any; status: any }>(
	'tiktokAccount/updateTiktokAccountStatus',
	async ({ id, status }: any, { rejectWithValue }: any) => {
		try {
			return await tiktokAccountAPI.updateTiktokAccountStatus(id, status);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const updateTiktokAccount = createAsyncThunk<any, { id: any; data: any }>(
	'tiktokAccount/updateTiktokAccount',
	async ({ id, data }: any, { rejectWithValue }: any) => {
		try {
			return await tiktokAccountAPI.updateTiktokAccount(id, data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

export const fetchResultsByAccountID = createAsyncThunk<any, { id: any; params?: any }>(
	'tiktokAccount/fetchResultsByAccountID',
	async ({ id, params }: any, { rejectWithValue }: any) => {
		try {
			return await tiktokAccountAPI.getResults(id, params);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);
