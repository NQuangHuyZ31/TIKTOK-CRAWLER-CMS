import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LoginLogItem } from '../../Action/loginLog';
import type { ActivityLogItem, ActivityStatistics } from '../../Action/activityLog';
import type { SystemInfoData } from '../../Action/systemDiagnostic';
import type { WorkerSettings, CleanupHistoryItem } from '../../Action/systemSetting';
import {
	fetchLoginLogs,
	fetchActivityLogs,
	fetchActivityStatistics,
	fetchSystemDiagnostic,
	fetchWorkerSettings,
	saveWorkerSettings,
	triggerManualCleanup,
	fetchCleanupHistory,
} from './systemThunks';

export interface SystemState {
	// Login Logs
	loginLogs: LoginLogItem[];
	loginPagination: {
		current_page: number;
		per_page: number;
		total: number;
	};
	loginLoading: boolean;
	loginParams: {
		page: number;
		per_page: number;
		search?: string;
		status?: string;
		device?: string;
	};

	// Activity Logs
	activityLogs: ActivityLogItem[];
	activityPagination: {
		current_page: number;
		per_page: number;
		total: number;
	};
	activityLoading: boolean;
	activityParams: {
		page: number;
		per_page: number;
		search?: string;
		action?: string;
		module?: string;
		status?: string;
	};
	activityStats: ActivityStatistics | null;
	selectedActivity: ActivityLogItem | null;
	detailModalOpen: boolean;

	// System Diagnostic
	diagnostic: SystemInfoData | null;
	diagnosticLoading: boolean;

	// Worker & Maintenance Settings
	workerSettings: WorkerSettings | null;
	settingsLoading: boolean;
	settingsSaving: boolean;
	cleanupRunning: boolean;
	cleanupHistory: CleanupHistoryItem[];

	error: string | null;
}

const initialState: SystemState = {
	loginLogs: [],
	loginPagination: {
		current_page: 1,
		per_page: 10,
		total: 0,
	},
	loginLoading: false,
	loginParams: {
		page: 1,
		per_page: 10,
		search: '',
	},

	activityLogs: [],
	activityPagination: {
		current_page: 1,
		per_page: 10,
		total: 0,
	},
	activityLoading: false,
	activityParams: {
		page: 1,
		per_page: 10,
		search: '',
	},
	activityStats: null,
	selectedActivity: null,
	detailModalOpen: false,

	diagnostic: null,
	diagnosticLoading: false,

	workerSettings: null,
	settingsLoading: false,
	settingsSaving: false,
	cleanupRunning: false,
	cleanupHistory: [],

	error: null,
};

const systemSlice = createSlice({
	name: 'system',
	initialState,
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
		},
		setDetailModalOpen: (state, action: PayloadAction<boolean>) => {
			state.detailModalOpen = action.payload;
		},
	},
	extraReducers: (builder) => {
		// Login Logs
		builder
			.addCase(fetchLoginLogs.pending, (state) => {
				state.loginLoading = true;
				state.error = null;
			})
			.addCase(fetchLoginLogs.fulfilled, (state, action) => {
				state.loginLoading = false;
				state.loginLogs = action.payload?.data ?? [];
				if (action.payload?.meta) {
					state.loginPagination = {
						current_page: action.payload.meta.current_page,
						per_page: action.payload.meta.per_page,
						total: action.payload.meta.total,
					};
				}
			})
			.addCase(fetchLoginLogs.rejected, (state, action) => {
				state.loginLoading = false;
				state.error = action.payload as string;
			});

		// Activity Logs
		builder
			.addCase(fetchActivityLogs.pending, (state) => {
				state.activityLoading = true;
				state.error = null;
			})
			.addCase(fetchActivityLogs.fulfilled, (state, action) => {
				state.activityLoading = false;
				state.activityLogs = action.payload?.data ?? [];
				if (action.payload?.meta) {
					state.activityPagination = {
						current_page: action.payload.meta.current_page,
						per_page: action.payload.meta.per_page,
						total: action.payload.meta.total,
					};
				}
			})
			.addCase(fetchActivityLogs.rejected, (state, action) => {
				state.activityLoading = false;
				state.error = action.payload as string;
			});

		// Activity Statistics
		builder.addCase(fetchActivityStatistics.fulfilled, (state, action) => {
			state.activityStats = action.payload ?? null;
		});

		// System Diagnostic
		builder
			.addCase(fetchSystemDiagnostic.pending, (state) => {
				state.diagnosticLoading = true;
				state.error = null;
			})
			.addCase(fetchSystemDiagnostic.fulfilled, (state, action) => {
				state.diagnosticLoading = false;
				state.diagnostic = action.payload ?? null;
			})
			.addCase(fetchSystemDiagnostic.rejected, (state, action) => {
				state.diagnosticLoading = false;
				state.error = action.payload as string;
			});

		// Worker Settings
		builder
			.addCase(fetchWorkerSettings.pending, (state) => {
				state.settingsLoading = true;
				state.error = null;
			})
			.addCase(fetchWorkerSettings.fulfilled, (state, action) => {
				state.settingsLoading = false;
				state.workerSettings = action.payload ?? null;
				if (action.payload?.last_cleanup_history) {
					state.cleanupHistory = action.payload.last_cleanup_history;
				}
			})
			.addCase(fetchWorkerSettings.rejected, (state, action) => {
				state.settingsLoading = false;
				state.error = action.payload as string;
			});

		// Save Worker Settings
		builder
			.addCase(saveWorkerSettings.pending, (state) => {
				state.settingsSaving = true;
				state.error = null;
			})
			.addCase(saveWorkerSettings.fulfilled, (state, action) => {
				state.settingsSaving = false;
				state.workerSettings = action.payload ?? null;
			})
			.addCase(saveWorkerSettings.rejected, (state, action) => {
				state.settingsSaving = false;
				state.error = action.payload as string;
			});

		// Manual Cleanup
		builder
			.addCase(triggerManualCleanup.pending, (state) => {
				state.cleanupRunning = true;
			})
			.addCase(triggerManualCleanup.fulfilled, (state) => {
				state.cleanupRunning = false;
			})
			.addCase(triggerManualCleanup.rejected, (state, action) => {
				state.cleanupRunning = false;
				state.error = action.payload as string;
			});

		// Cleanup History
		builder.addCase(fetchCleanupHistory.fulfilled, (state, action) => {
			state.cleanupHistory = action.payload ?? [];
		});
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
