import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PermissionItem } from '../../Action/permission';
import {
    fetchPermissions,
    fetchDistinctModules,
    fetchGroupedPermissions,
} from './permissionThunks';

export interface PermissionState {
    data: PermissionItem[];
    modulesList: string[];
    groupedPermissions: Record<string, PermissionItem[]>;
    loading: boolean;
    error: string | null;
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
    };
    params: {
        page: number;
        per_page: number;
        search?: string;
        module?: string;
        action?: string;
        [key: string]: any;
    };
    createPermissionModalOpen: boolean;
}

const initialState: PermissionState = {
    data: [],
    modulesList: [],
    groupedPermissions: {},
    loading: false,
    error: null,
    pagination: {
        current_page: 1,
        per_page: 15,
        total: 0,
    },
    params: {
        page: 1,
        per_page: 15,
        search: '',
    },
    createPermissionModalOpen: false,
};

const permissionSlice = createSlice({
    name: 'permission',
    initialState,

    reducers: {
        setParams: (state, action: PayloadAction<Record<string, any>>) => {
            state.params = { ...state.params, ...action.payload };
        },
        resetParams: (state) => {
            state.params = { page: 1, per_page: 15, search: '' };
        },
        setCreatePermissionModalOpen: (state, action: PayloadAction<boolean>) => {
            state.createPermissionModalOpen = action.payload;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchPermissions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPermissions.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload as any;
                const list = payload?.data ?? [];
                state.data = list;

                const meta = payload?.meta ?? {};
                state.pagination = {
                    current_page: meta.current_page ?? state.params.page,
                    per_page: meta.per_page ?? state.params.per_page,
                    total: meta.total ?? list.length,
                };
            })
            .addCase(fetchPermissions.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? 'Failed to load permissions';
            })
            .addCase(fetchDistinctModules.fulfilled, (state, action) => {
                const payload = action.payload as any;
                state.modulesList = payload?.data ?? [];
            })
            .addCase(fetchGroupedPermissions.fulfilled, (state, action) => {
                const payload = action.payload as any;
                state.groupedPermissions = payload?.data ?? {};
            });
    },
});

export const {
    setParams,
    resetParams,
    setCreatePermissionModalOpen,
} = permissionSlice.actions;

export default permissionSlice.reducer;
