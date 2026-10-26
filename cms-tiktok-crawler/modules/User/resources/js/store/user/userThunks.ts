import { createAsyncThunk } from '@reduxjs/toolkit';
import userAPI from '../../Action/user';

/**
 * Fetch all users with pagination, search, and filters.
 */
export const fetchAllUsers = createAsyncThunk<any, any>(
    'user/fetchAllUsers',
    async (params: any, { rejectWithValue }: any) => {
        try {
            return await userAPI.getUsers(params);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? error.message);
        }
    }
);

/**
 * Fetch aggregate KPI statistics summary for users.
 */
export const fetchUserStatistics = createAsyncThunk<any, void | undefined>(
    'user/fetchUserStatistics',
    async (_: any, { rejectWithValue }: any) => {
        try {
            return await userAPI.getStatisticsSummary();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? error.message);
        }
    }
);

/**
 * Fetch user details by ID.
 */
export const fetchUserDetail = createAsyncThunk<any, number | string>(
    'user/fetchUserDetail',
    async (id: number | string, { rejectWithValue }: any) => {
        try {
            return await userAPI.getUserById(id);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? error.message);
        }
    }
);

/**
 * Fetch system roles and permissions catalog for assignment.
 */
export const fetchRolesAndPermissions = createAsyncThunk<any, void | undefined>(
    'user/fetchRolesAndPermissions',
    async (_: any, { rejectWithValue }: any) => {
        try {
            return await userAPI.getRolesAndPermissions();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? error.message);
        }
    }
);
