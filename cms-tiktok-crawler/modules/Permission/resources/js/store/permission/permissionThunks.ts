import { createAsyncThunk } from '@reduxjs/toolkit';
import {
    getPermissions,
    getDistinctModules,
    getGroupedPermissions,
} from '../../Action/permission';

/**
 * Fetch permissions list with pagination, search, and module/action filters.
 */
export const fetchPermissions = createAsyncThunk<any, Record<string, any> | undefined>(
    'permission/fetchPermissions',
    async (params: Record<string, any> = {}, { rejectWithValue }: any) => {
        try {
            return await getPermissions(params);
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? error?.message ?? 'Failed to retrieve permissions list'
            );
        }
    }
);

/**
 * Fetch distinct module names for filter & form dropdowns.
 */
export const fetchDistinctModules = createAsyncThunk<any, void | undefined>(
    'permission/fetchDistinctModules',
    async (_: any, { rejectWithValue }: any) => {
        try {
            return await getDistinctModules();
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? error?.message ?? 'Failed to retrieve distinct modules'
            );
        }
    }
);

/**
 * Fetch grouped permissions matrix by module.
 */
export const fetchGroupedPermissions = createAsyncThunk<any, void | undefined>(
    'permission/fetchGroupedPermissions',
    async (_: any, { rejectWithValue }: any) => {
        try {
            return await getGroupedPermissions();
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? error?.message ?? 'Failed to retrieve grouped permissions'
            );
        }
    }
);
