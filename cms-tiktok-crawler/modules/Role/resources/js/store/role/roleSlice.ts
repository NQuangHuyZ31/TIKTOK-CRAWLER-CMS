import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RoleItem, PermissionItem } from '../../Action/role';
import { fetchRoles, fetchAvailablePermissions } from './roleThunks';

export interface RoleState {
	data: RoleItem[];
	permissions: Record<string, PermissionItem[]>;
	loading: boolean;
	permissionsLoading: boolean;
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
		[key: string]: any;
	};
	modalOpen: boolean;
	selectedRole: RoleItem | null;
}

const initialState: RoleState = {
	data: [],
	permissions: {},
	loading: false,
	permissionsLoading: false,
	error: null,
	pagination: {
		current_page: 1,
		per_page: 10,
		total: 0,
	},
	params: {
		page: 1,
		per_page: 10,
		search: '',
	},
	modalOpen: false,
	selectedRole: null,
};

const roleSlice = createSlice({
	name: 'role',
	initialState,

	reducers: {
		setParams: (state, action: PayloadAction<Record<string, any>>) => {
			state.params = { ...state.params, ...action.payload };
		},
		resetParams: (state) => {
			state.params = { page: 1, per_page: 10, search: '' };
		},
		setModalOpen: (state, action: PayloadAction<boolean>) => {
			state.modalOpen = action.payload;
		},
		setSelectedRole: (state, action: PayloadAction<RoleItem | null>) => {
			state.selectedRole = action.payload;
		},
	},

	extraReducers: (builder) => {
		// fetchRoles
		builder
			.addCase(fetchRoles.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchRoles.fulfilled, (state, action) => {
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
			.addCase(fetchRoles.rejected, (state, action) => {
				state.loading = false;
				state.error = (action.payload as string) ?? 'Failed to load roles';
			});

		// fetchAvailablePermissions
		builder
			.addCase(fetchAvailablePermissions.pending, (state) => {
				state.permissionsLoading = true;
			})
			.addCase(fetchAvailablePermissions.fulfilled, (state, action) => {
				state.permissionsLoading = false;
				const payload = action.payload as any;
				state.permissions = payload?.data ?? {};
			})
			.addCase(fetchAvailablePermissions.rejected, (state) => {
				state.permissionsLoading = false;
			});
	},
});

export const { setParams, resetParams, setModalOpen, setSelectedRole } = roleSlice.actions;

export default roleSlice.reducer;
