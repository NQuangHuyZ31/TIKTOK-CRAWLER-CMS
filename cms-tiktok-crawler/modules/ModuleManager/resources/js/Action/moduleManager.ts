import { api } from '@core/Action/api';

export interface ScaffoldSubmenuItem {
	label: string;
	path: string;
	icon?: string;
}

export interface ScaffoldModulePayload {
	module: string;
	name?: string;
	description?: string;
	route_path?: string;
	icon?: string;
	order?: number;
	menu_placement?: 'top' | 'submenu';
	parent_path?: string;
	create_permissions?: boolean;
	permissions?: string[];
	submenus?: ScaffoldSubmenuItem[];
}

export interface ScaffoldModuleResult {
	module_name: string;
	module_key: string;
	route_path: string;
	created_files: string[];
	skipped_files: string[];
	created_permissions_count: number;
	build_command: string;
}

export interface ModuleVisibilityData {
	hidden_modules: string[];
}

const baseURL = '/module-manager/module-manager';

export const getModuleVisibility = () =>
	api<{ status: string; data: ModuleVisibilityData }>(`${baseURL}/visibility`);

export const updateModuleVisibility = (hidden_modules: string[]) =>
	api<{ status: string; data: ModuleVisibilityData }>(`${baseURL}/update-visibility`, {
		method: 'POST',
		data: { hidden_modules },
	});

export const scaffoldModule = (data: ScaffoldModulePayload) =>
	api<{ status: string; message: string; data: ScaffoldModuleResult }>(`${baseURL}/scaffold`, {
		method: 'POST',
		data,
	});
