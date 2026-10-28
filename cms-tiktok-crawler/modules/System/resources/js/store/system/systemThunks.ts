import { createAsyncThunk } from '@reduxjs/toolkit';
import { getLoginLogs } from '../../Action/loginLog';
import { getActivityLogs, getActivityStatistics } from '../../Action/activityLog';
import { getSystemDiagnostic } from '../../Action/systemDiagnostic';

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
