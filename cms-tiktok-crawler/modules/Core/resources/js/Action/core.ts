import { api } from './api';

export interface ModuleMetadataItem {
	label: string;
	icon: string;
	color: string;
}

export interface PermissionActionItem {
	value: string;
	label: string;
	desc?: string;
	basic?: boolean;
}

export interface CoreMetadata {
	modules: string[];
	permission_actions: PermissionActionItem[];
	protected_modules: string[];
	ignore_group?: string[];
	module_metadata?: Record<string, ModuleMetadataItem>;
	dev_only_actions: Record<string, string[]>;
	enable_dev: boolean;
}

/**
 * Fetch core system metadata (active modules, permission actions, common actions).
 * API: GET /admin/api/core/metadata
 */
export const getCoreMetadata = () =>
	api<{ status: string; data: CoreMetadata }>('/core/metadata');
