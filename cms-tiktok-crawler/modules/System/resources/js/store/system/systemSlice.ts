import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ActivityLogItem } from '../../Action/activityLog';
import {
	fetchLoginLogs,
	fetchActivityLogs,
	fetchActivityStatistics,
	fetchSystemDiagnostic,
	fetchWorkerSettings,
	saveWorkerSettings,
	triggerManualCleanup,
} from './systemThunks';
import { initialSystemState, type SystemState } from './systemSliceTypes';

export type { SystemState };

const systemSlice = createSlice({
	name: 'system',
	initialState: initialSystemState,

	reducers: {
		setLoginParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.loginParams = { ...state.loginParams, ...action.payload };
		},
		resetLoginParams: (state) => {
			state.loginParams = { page: 1, per_page: 10, search: '' };
		},
		setActivityParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.activityParams = { ...state.activityParams, ...action.payload };
		},
		resetActivityParams: (state) => {
			state.activityParams = { page: 1, per_page: 10, search: '' };
		},
		setSelectedActivity: (state, action: PayloadAction<ActivityLogItem | null>) => {
			state.selectedActivity = action.payload;
			state.detailModalOpen = action.payload !== null;
		},
		setDetailModalOpen: (state, action: PayloadAction<boolean>) => {
			state.detailModalOpen = action.payload;
			if (!action.payload) state.selectedActivity = null;
		},
	},

	extraReducers: (builder) => {
		builder
			.addCase(fetchLoginLogs.pending, (state) => {
				state.loginLoading = true;
				state.error = null;
			})
			.addCase(fetchLoginLogs.fulfilled, (state, action) => {
				state.loginLoading = false;
				const payload = action.payload as any;
				state.loginLogs = payload?.data ?? [];
				const meta = payload?.meta ?? {};
				state.loginPagination = {
					current_page: meta.current_page ?? state.loginParams.page,
					per_page: meta.per_page ?? state.loginParams.per_page,
					total: meta.total ?? (payload?.data?.length || 0),
				};
			})
			.addCase(fetchLoginLogs.rejected, (state, action) => {
				state.loginLoading = false;
				state.error = (action.payload as string) ?? 'Failed to load login logs';
			})
			.addCase(fetchActivityLogs.pending, (state) => {
				state.activityLoading = true;
				state.error = null;
			})
			.addCase(fetchActivityLogs.fulfilled, (state, action) => {
				state.activityLoading = false;
				const payload = action.payload as any;
				state.activityLogs = payload?.data ?? [];
				const meta = payload?.meta ?? {};
				state.activityPagination = {
					current_page: meta.current_page ?? state.activityParams.page,
					per_page: meta.per_page ?? state.activityParams.per_page,
					total: meta.total ?? (payload?.data?.length || 0),
				};
			})
			.addCase(fetchActivityLogs.rejected, (state, action) => {
				state.activityLoading = false;
				state.error = (action.payload as string) ?? 'Failed to load activity logs';
			})
			.addCase(fetchActivityStatistics.fulfilled, (state, action) => {
				state.activityStats = (action.payload as any)?.data ?? null;
			})
			.addCase(fetchSystemDiagnostic.pending, (state) => {
				state.diagnosticLoading = true;
			})
			.addCase(fetchSystemDiagnostic.fulfilled, (state, action) => {
				state.diagnosticLoading = false;
				state.diagnostic = action.payload as any ?? null;
			})
			.addCase(fetchSystemDiagnostic.rejected, (state) => {
				state.diagnosticLoading = false;
			})
			.addCase(fetchWorkerSettings.pending, (state) => {
				state.settingsLoading = true;
			})
			.addCase(fetchWorkerSettings.fulfilled, (state, action) => {
				state.settingsLoading = false;
				state.workerSettings = (action.payload as any) ?? null;
				state.cleanupHistory = (action.payload as any)?.last_cleanup_history ?? [];
			})
			.addCase(fetchWorkerSettings.rejected, (state) => {
				state.settingsLoading = false;
			})
			.addCase(saveWorkerSettings.pending, (state) => {
				state.settingsSaving = true;
			})
			.addCase(saveWorkerSettings.fulfilled, (state, action) => {
				state.settingsSaving = false;
				state.workerSettings = (action.payload as any)?.data ?? state.workerSettings;
			})
			.addCase(saveWorkerSettings.rejected, (state) => {
				state.settingsSaving = false;
			})
			.addCase(triggerManualCleanup.pending, (state) => {
				state.cleanupRunning = true;
			})
			.addCase(triggerManualCleanup.fulfilled, (state) => {
				state.cleanupRunning = false;
			})
			.addCase(triggerManualCleanup.rejected, (state) => {
				state.cleanupRunning = false;
			})
	},
});

export const {
	setLoginParams,
	resetLoginParams,
	setActivityParams,
	resetActivityParams,
	setSelectedActivity,
	setDetailModalOpen,
} = systemSlice.actions;

export default systemSlice.reducer;
