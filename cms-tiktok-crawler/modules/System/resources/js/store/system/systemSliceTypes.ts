import type { LoginLogItem } from '../../Action/loginLog';
import type { ActivityLogItem, ActivityStatistics } from '../../Action/activityLog';
import type { SystemInfoData } from '../../Action/systemDiagnostic';
import type { WorkerSettings, CleanupHistoryItem } from '../../Action/systemSetting';

export interface SystemState {
	loginLogs: LoginLogItem[];
	loginPagination: {
		current_page: number;
		per_page: number;
		total: number;
	};
	loginLoading: boolean;
	loginParams: {
		page: number;
		per_page: number;
		search?: string;
		status?: string;
		device?: string;
	};

	activityLogs: ActivityLogItem[];
	activityPagination: {
		current_page: number;
		per_page: number;
		total: number;
	};
	activityLoading: boolean;
	activityParams: {
		page: number;
		per_page: number;
		search?: string;
		action?: string;
		module?: string;
		status?: string;
	};
	activityStats: ActivityStatistics | null;
	selectedActivity: ActivityLogItem | null;
	detailModalOpen: boolean;

	diagnostic: SystemInfoData | null;
	diagnosticLoading: boolean;

	workerSettings: WorkerSettings | null;
	settingsLoading: boolean;
	settingsSaving: boolean;
	cleanupRunning: boolean;
	cleanupHistory: CleanupHistoryItem[];

	error: string | null;
}

export const initialSystemState: SystemState = {
	loginLogs: [],
	loginPagination: {
		current_page: 1,
		per_page: 10,
		total: 0,
	},
	loginLoading: false,
	loginParams: {
		page: 1,
		per_page: 10,
		search: '',
	},

	activityLogs: [],
	activityPagination: {
		current_page: 1,
		per_page: 10,
		total: 0,
	},
	activityLoading: false,
	activityParams: {
		page: 1,
		per_page: 10,
		search: '',
	},
	activityStats: null,
	selectedActivity: null,
	detailModalOpen: false,

	diagnostic: null,
	diagnosticLoading: false,

	workerSettings: null,
	settingsLoading: false,
	settingsSaving: false,
	cleanupRunning: false,
	cleanupHistory: [],

	error: null,
};
