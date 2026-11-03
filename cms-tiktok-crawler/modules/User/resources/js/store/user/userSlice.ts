import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    fetchAllUsers,
    fetchUserStatistics,
    fetchUserDetail,
    fetchRolesAndPermissions,
} from './userThunks';
import { initialUserState, type UserState } from './userSliceTypes';

export type { UserState };

const userSlice = createSlice({
    name: 'user',
    initialState: initialUserState,

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
