import { createSlice } from "@reduxjs/toolkit";
import { fechAllTiktokAccounts } from "@modules/TiktokAccount/assets/js/store/tiktokAccount/tiktokAccountThunks";

const initialState = {
	data: [],
	loading: false,
	error: null,
	pagination: {
		page: 1,
		per_page: 5,
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
		setParams: (state, action) => {
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

				state.data = res?.data ?? [];
				state.pagination = {
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				};
			})

			.addCase(fechAllTiktokAccounts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Failed to fetch tiktok accounts';
			})
	}
})

export const { setParams } = tiktokAccountSlice.actions;
export default tiktokAccountSlice.reducer;
