import type { UserItem, UserStatistics, UserRole, UserPermission } from '../../Action/user';

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

export const initialUserState: UserState = {
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
