import { createAsyncThunk } from '@reduxjs/toolkit';
import { getPermissions } from '../../Action/permission';

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
