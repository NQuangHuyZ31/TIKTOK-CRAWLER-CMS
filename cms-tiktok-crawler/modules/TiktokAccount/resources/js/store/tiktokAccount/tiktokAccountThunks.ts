import { createAsyncThunk } from "@reduxjs/toolkit";
import tiktokAccountAPI from "../../Action/tiktokAccount";

/**
 * Fetch all TikTok accounts with pagination and filters for the main accounts list table.
 */
export const fetchAllTiktokAccounts = createAsyncThunk<any, any>(
	'tiktokAccount/fetchAllTiktokAccounts',
	async (params: any, { rejectWithValue }: any) => {
		try {
			return await tiktokAccountAPI.getAllTiktokAccounts(params);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message ?? error.message);
		}
	}
);

/**
 * Fetch aggregate statistics summary for TikTok accounts KPI cards.
 */
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

