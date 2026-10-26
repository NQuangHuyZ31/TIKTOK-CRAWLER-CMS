import { createAsyncThunk } from '@reduxjs/toolkit';
import { getRoles, getAvailablePermissions } from '../../Action/role';

/**
 * Fetch all system roles with pagination and search parameters.
 */
export const fetchRoles = createAsyncThunk<any, Record<string, any> | undefined>(
	'role/fetchRoles',
	async (params: Record<string, any> = {}, { rejectWithValue }: any) => {
		try {
			return await getRoles(params);
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'Failed to retrieve roles list');
		}
	},
);

/**
 * Fetch available system permissions catalog grouped by module.
 */
export const fetchAvailablePermissions = createAsyncThunk<any, void | undefined>(
	'role/fetchAvailablePermissions',
	async (_: any, { rejectWithValue }: any) => {
		try {
			return await getAvailablePermissions();
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'Failed to retrieve permissions');
		}
	},
);
