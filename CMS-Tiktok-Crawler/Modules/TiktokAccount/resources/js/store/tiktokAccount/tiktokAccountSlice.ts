import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
	fechAllTiktokAccounts,
	fetchTiktokAccountByID,
	fetchStatisticSummary,
	deleteTiktokAccount,
	updateTiktokAccountStatus,
	updateTiktokAccount,
	fetchResultsByAccountID
} from "@modules/TiktokAccount/resources/js/store/tiktokAccount/tiktokAccountThunks";

export interface TiktokAccountState {
	data: any[];
	results: any[];
	resultsLoading: boolean;
	resultsError: any;
	currentAccount: any;
	loading: boolean;
	statistics: any;
	statisticsLoading: boolean;
	statisticsError: any;
	error: any;
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
	results: [],
	resultsLoading: false,
	resultsError: null,
	currentAccount: null,
	loading: false,
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
	error: null,
	pagination: {
		page: 1,
		per_page: 5,
		total: 0,
	},
	params: {
		page: 1,
		per_page: 5,
	}
};

const tiktokAccountSlice = createSlice({
	initialState,
	name: 'tiktokAccount',

	reducers: {
		setParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.params = { ...state.params, ...action.payload };
		}
	},

	extraReducers: (builder) => {
		// Fetch all tiktok accounts
		builder
			.addCase(fechAllTiktokAccounts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fechAllTiktokAccounts.fulfilled, (state, action) => {
				state.loading = false;
				const res = action.payload;

				state.data = Array.isArray(res?.data) ? res.data : [];
				state.pagination = {
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				};
			})
			.addCase(fechAllTiktokAccounts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Failed to fetch tiktok accounts';
			});

		// Fetch tiktok account by ID
		builder
			.addCase(fetchTiktokAccountByID.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchTiktokAccountByID.fulfilled, (state, action) => {
				state.loading = false;
				const res = action.payload;
				state.currentAccount = res?.data ?? null;
			})
			.addCase(fetchTiktokAccountByID.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Failed to fetch tiktok account by ID';
			});

		// Fetch statistic summary
		builder
			.addCase(fetchStatisticSummary.pending, (state) => {
				state.statisticsLoading = true;
				state.statisticsError = null;
			})
			.addCase(fetchStatisticSummary.fulfilled, (state, action) => {
				state.statisticsLoading = false;
				state.statistics = action.payload ?? {};
			})
			.addCase(fetchStatisticSummary.rejected, (state, action) => {
				state.statisticsLoading = false;
				state.statisticsError = action.payload ?? 'Failed to fetch statistic summary';
			});

		// Delete account by ID
		builder
			.addCase(deleteTiktokAccount.fulfilled, (state, action) => {
				const deletedAccount = state.data.find(
					(account) => account.id === action.meta.arg
				);
				if (!deletedAccount) {
					return;
				}

				state.data = state.data.filter(
					(account) => account.id !== action.meta.arg
				);
				state.pagination.total = Math.max((state.pagination.total ?? 0) - 1, 0);

				if (state.statistics && deletedAccount) {
					state.statistics.total_accounts = Math.max((state.statistics.total_accounts ?? 0) - 1, 0);

					if (deletedAccount.status === 'active') {
						state.statistics.total_active_accounts = Math.max((state.statistics.total_active_accounts ?? 0) - 1, 0);
					}

					if (deletedAccount.status === 'inactive') {
						state.statistics.total_inactive_accounts = Math.max((state.statistics.total_inactive_accounts ?? 0) - 1, 0);
					}

					state.statistics.total_followers = Math.max((state.statistics.total_followers ?? 0) - (deletedAccount.followers_count ?? 0), 0);
					state.statistics.total_following = Math.max((state.statistics.total_following ?? 0) - (deletedAccount.following_count ?? 0), 0);
					state.statistics.total_likes = Math.max((state.statistics.total_likes ?? 0) - (deletedAccount.likes_count ?? 0), 0);
				}
			});

		// Update account status
		builder
			.addCase(updateTiktokAccountStatus.fulfilled, (state, action) => {
				const updatedAccount = action.payload?.data ?? action.payload;
				state.currentAccount = updatedAccount;
				state.data = state.data.map((account) => (
					String(account.id) === String(updatedAccount?.id)
						? { ...account, status: updatedAccount.status }
						: account
				));
			});

		// Update account
		builder
			.addCase(updateTiktokAccount.fulfilled, (state, action) => {
				const updatedAccount = action.payload?.data ?? action.payload;
				state.currentAccount = updatedAccount;
				state.data = state.data.map((account) => (
					String(account.id) === String(updatedAccount?.id)
						? { ...account, ...updatedAccount }
						: account
				));
			});

		// Fetch results by account ID
		builder
			.addCase(fetchResultsByAccountID.pending, (state) => {
				state.resultsLoading = true;
				state.resultsError = null;
			})
			.addCase(fetchResultsByAccountID.fulfilled, (state, action) => {
				state.resultsLoading = false;
				const res = action.payload;
				state.results = res?.data ?? [];
				state.pagination = {
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				};
			})
			.addCase(fetchResultsByAccountID.rejected, (state, action) => {
				state.resultsLoading = false;
				state.resultsError = action.payload ?? 'Failed to fetch results by account ID';
			});
	}
});

export const { setParams } = tiktokAccountSlice.actions;
export default tiktokAccountSlice.reducer;
