import { createAsyncThunk } from "@reduxjs/toolkit";
import tiktokAccountAPI from "@modules/TiktokAccount/assets/js/services/tiktokAccountAPI";

export const fechAllTiktokAccounts = createAsyncThunk(
	'tiktokAccount/fetchAllTiktokAccounts',
	async (params, { rejectWithValue }) => {
		try {
			return await tiktokAccountAPI.getAllTiktokAccount(params);
		} catch (error) {
			return rejectWithValue(error.response?.data?.message ?? error.message)
		}
	}
)