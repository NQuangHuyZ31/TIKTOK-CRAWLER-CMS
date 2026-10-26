import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserItem, UserStatistics, UserRole, UserPermission } from '../../Action/user';
import {
    fetchAllUsers,
    fetchUserStatistics,
    fetchUserDetail,
    fetchRolesAndPermissions,
} from './userThunks';

export interface UserState {
    data: UserItem[];
    loading: boolean;
    error: string | null;
    currentUser: UserItem | null;
    detailLoading: boolean;
    statistics: UserStatistics;
    statisticsLoading: boolean;
    rolesCatalog: UserRole[];
    permissionsCatalog: UserPermission[];
    groupedPermissionsCatalog: Array<{ module: string; items: UserPermission[] }>;
    catalogLoading: boolean;
    pagination: {
        page: number;
        per_page: number;
        total: number;
    };
    params: {
        page: number;
        per_page: number;
        search?: string;
        status?: string;
        role?: string;
        [key: string]: any;
    };
}

const initialState: UserState = {
    data: [],
    loading: false,
    error: null,
    currentUser: null,
    detailLoading: false,
    statistics: {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        blocked_users: 0,
        admin_users: 0,
        manager_users: 0,
        editor_users: 0,
        viewer_users: 0,
    },
    statisticsLoading: false,
    rolesCatalog: [],
    permissionsCatalog: [],
    groupedPermissionsCatalog: [],
    catalogLoading: false,
    pagination: {
        page: 1,
        per_page: 10,
        total: 0,
    },
    params: {
        page: 1,
        per_page: 10,
        search: '',
        status: '',
        role: '',
    },
};

const userSlice = createSlice({
    name: 'user',
    initialState,

    reducers: {
        setParams: (state, action: PayloadAction<Record<string, any>>) => {
            state.params = { ...state.params, ...action.payload };
        },
        resetParams: (state) => {
            state.params = {
                page: 1,
                per_page: state.params.per_page || 10,
                search: '',
                status: '',
                role: '',
            };
        },
        clearCurrentUser: (state) => {
            state.currentUser = null;
        },
    },

    extraReducers: (builder) => {
        // fetchAllUsers
        builder
            .addCase(fetchAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload;
                state.data = payload?.data ?? [];
                if (payload?.meta) {
                    state.pagination = {
                        page: payload.meta.current_page ?? 1,
                        per_page: payload.meta.per_page ?? 10,
                        total: payload.meta.total ?? 0,
                    };
                }
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Failed to fetch users';
            });

        // fetchUserStatistics
        builder
            .addCase(fetchUserStatistics.pending, (state) => {
                state.statisticsLoading = true;
            })
            .addCase(fetchUserStatistics.fulfilled, (state, action) => {
                state.statisticsLoading = false;
                state.statistics = action.payload?.data ?? action.payload ?? state.statistics;
            })
            .addCase(fetchUserStatistics.rejected, (state) => {
                state.statisticsLoading = false;
            });

        // fetchUserDetail
        builder
            .addCase(fetchUserDetail.pending, (state) => {
                state.detailLoading = true;
                state.error = null;
            })
            .addCase(fetchUserDetail.fulfilled, (state, action) => {
                state.detailLoading = false;
                state.currentUser = action.payload?.data ?? action.payload ?? null;
            })
            .addCase(fetchUserDetail.rejected, (state, action) => {
                state.detailLoading = false;
                state.error = (action.payload as string) || 'Failed to fetch user details';
            });

        // fetchRolesAndPermissions
        builder
            .addCase(fetchRolesAndPermissions.pending, (state) => {
                state.catalogLoading = true;
            })
            .addCase(fetchRolesAndPermissions.fulfilled, (state, action) => {
                state.catalogLoading = false;
                const payload = action.payload?.data ?? action.payload ?? {};
                state.rolesCatalog = payload.roles ?? [];
                state.permissionsCatalog = payload.permissions ?? [];
                state.groupedPermissionsCatalog = payload.grouped_permissions ?? [];
            })
            .addCase(fetchRolesAndPermissions.rejected, (state) => {
                state.catalogLoading = false;
            });
    },
});

export const { setParams, resetParams, clearCurrentUser } = userSlice.actions;
export default userSlice.reducer;
