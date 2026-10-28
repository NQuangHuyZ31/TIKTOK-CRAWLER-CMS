import { createAsyncThunk } from '@reduxjs/toolkit';
import { getLoginLogs } from '../../Action/loginLog';
import { getActivityLogs, getActivityStatistics } from '../../Action/activityLog';
import { getSystemDiagnostic } from '../../Action/systemDiagnostic';
import {
	getSystemSettings,
	updateSystemSettings,
	runLogCleanup,
	getCleanupHistory,
	WorkerSettings,
} from '../../Action/systemSetting';

export const fetchLoginLogs = createAsyncThunk(
	'system/fetchLoginLogs',
	async (params: Record<string, any> = {}, { rejectWithValue }) => {
		try {
			const res = await getLoginLogs(params);
			return res;
		} catch (error: any) {
			return rejectWithValue(error?.message || 'Failed to fetch login logs');
		}
	}
);

export const fetchActivityLogs = createAsyncThunk(
	'system/fetchActivityLogs',
	async (params: Record<string, any> = {}, { rejectWithValue }) => {
		try {
			const res = await getActivityLogs(params);
			return res;
		} catch (error: any) {
			return rejectWithValue(error?.message || 'Failed to fetch activity logs');
		}
	}
);

export const fetchActivityStatistics = createAsyncThunk(
	'system/fetchActivityStatistics',
	async (_, { rejectWithValue }) => {
		try {
			const res = await getActivityStatistics();
			return res.data;
		} catch (error: any) {
			return rejectWithValue(error?.message || 'Failed to fetch activity statistics');
		}
	}
);

export const fetchSystemDiagnostic = createAsyncThunk(
	'system/fetchSystemDiagnostic',
	async (_, { rejectWithValue }) => {
		try {
			const res = await getSystemDiagnostic();
			return res.data;
		} catch (error: any) {
			return rejectWithValue(error?.message || 'Failed to fetch system diagnostic info');
		}
	}
);

export const fetchWorkerSettings = createAsyncThunk(
	'system/fetchWorkerSettings',
	async (group: string = 'worker', { rejectWithValue }) => {
		try {
			const res = await getSystemSettings(group);
			return res.data.settings;
		} catch (error: any) {
			return rejectWithValue(error?.message || 'Failed to fetch worker settings');
		}
	}
);

export const saveWorkerSettings = createAsyncThunk(
	'system/saveWorkerSettings',
	async (payload: { settings: Partial<WorkerSettings>; group?: string }, { rejectWithValue }) => {
		try {
			const res = await updateSystemSettings(payload.settings, payload.group || 'worker');
			return res.data.settings;
		} catch (error: any) {
			return rejectWithValue(error?.message || 'Failed to save worker settings');
		}
	}
);

export const triggerManualCleanup = createAsyncThunk(
	'system/triggerManualCleanup',
	async (params: { activity_days?: number; login_days?: number } = {}, { rejectWithValue }) => {
		try {
			const res = await runLogCleanup(params);
			return res;
		} catch (error: any) {
			return rejectWithValue(error?.message || 'Failed to execute manual log cleanup');
		}
	}
);

export const fetchCleanupHistory = createAsyncThunk(
	'system/fetchCleanupHistory',
	async (_, { rejectWithValue }) => {
		try {
			const res = await getCleanupHistory();
			return res.data;
		} catch (error: any) {
			return rejectWithValue(error?.message || 'Failed to fetch cleanup history');
		}
	}
);
