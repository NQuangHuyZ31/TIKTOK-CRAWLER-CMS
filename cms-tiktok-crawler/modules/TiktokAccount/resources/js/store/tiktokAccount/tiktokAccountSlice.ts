import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
	fetchAllTiktokAccounts,
	fetchStatisticSummary,
} from "./tiktokAccountThunks";

export interface TiktokAccountState {
	data: any[];
	loading: boolean;
	error: string | null;
	statistics: any;
	statisticsLoading: boolean;
	statisticsError: string | null;
	pagination: {
		page: number;
		per_page: number;
		total: number;
	};
	params: {
		page: number;
		per_page: number;
		[key: string]: any;
	};
}

const initialState: TiktokAccountState = {
	data: [],
	loading: false,
	error: null,
	statistics: {
		total_accounts: 0,
		total_active_accounts: 0,
		total_inactive_accounts: 0,
		total_followers: 0,
		total_following: 0,
		total_likes: 0,
	},
	statisticsLoading: false,
	statisticsError: null,
	pagination: {
		page: 1,
		per_page: 10,
		total: 0,
	},
	params: {
		page: 1,
		per_page: 10,
	}
};

const tiktokAccountSlice = createSlice({
	initialState,
	name: 'tiktokAccount',

	reducers: {
		setParams: (state, action: PayloadAction<Record<string, any>>) => {
			const updated = { ...state.params, ...action.payload };
			const cleaned: Record<string, any> = {};
			Object.entries(updated).forEach(([k, v]) => {
				if (v !== undefined && v !== null && v !== '' && v !== 'Invalid Date') {
					cleaned[k] = v;
				}
			});
			state.params = cleaned as any;
		},
		resetParams: (state) => {
			state.params = {
				page: 1,
				per_page: 10,
			};
		},
	},

	extraReducers: (builder) => {
		// Fetch all tiktok accounts
		builder
			.addCase(fetchAllTiktokAccounts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchAllTiktokAccounts.fulfilled, (state, action) => {
				state.loading = false;
				const res = action.payload;

				state.data = Array.isArray(res?.data) ? res.data : [];
				state.pagination = {
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				};
			})
			.addCase(fetchAllTiktokAccounts.rejected, (state, action) => {
				state.loading = false;
				state.error = (action.payload as string) ?? 'Failed to fetch tiktok accounts';
			});

		// Fetch statistic summary
		builder
			.addCase(fetchStatisticSummary.pending, (state) => {
				state.statisticsLoading = true;
				state.statisticsError = null;
			})
			.addCase(fetchStatisticSummary.fulfilled, (state, action) => {
				state.statisticsLoading = false;
				state.statistics = action.payload?.data ?? action.payload ?? {};
			})
			.addCase(fetchStatisticSummary.rejected, (state, action) => {
				state.statisticsLoading = false;
				state.statisticsError = (action.payload as string) ?? 'Failed to fetch statistic summary';
			});
	}
});

export const { setParams, resetParams } = tiktokAccountSlice.actions;
export default tiktokAccountSlice.reducer;
