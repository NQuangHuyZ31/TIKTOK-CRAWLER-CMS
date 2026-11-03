import { getModuleConfig } from '../../configs/systemOptions';
import type { ModuleRow, PermissionInputType, PermissionItem } from './permissionMatrixTypes';

/**
 * Normalizes any backend permission catalog into a uniform ModuleRow array.
 */
export function normalizePermissions(input?: PermissionInputType): ModuleRow[] {
	if (!input) return [];

	const grouped: Record<string, PermissionItem[]> = {};

	if (Array.isArray(input)) {
		input.forEach((item: any) => {
			if (!item || typeof item !== 'object') return;

			if ('module' in item && Array.isArray(item.items)) {
				const modKey = String(item.module).toLowerCase();
				if (!grouped[modKey]) grouped[modKey] = [];
				item.items.forEach((subItem: PermissionItem) => {
					grouped[modKey].push(subItem);
				});
			} else if ('slug' in item) {
				const modKey = (item.module ? String(item.module) : item.slug.split('.')[0] || 'other').toLowerCase();
				if (!grouped[modKey]) grouped[modKey] = [];
				grouped[modKey].push(item as PermissionItem);
			}
		});
	} else if (typeof input === 'object') {
		Object.entries(input).forEach(([modKey, list]) => {
			if (Array.isArray(list)) {
				grouped[modKey.toLowerCase()] = [...list];
			}
		});
	}

	return Object.entries(grouped).map(([modKey, items]) => {
		const conf = getModuleConfig(modKey);
		const actionsMap: Record<string, PermissionItem> = {};

		items.forEach((p) => {
			const act = (p.action || p.slug.split('.')[1] || '').toLowerCase();
			if (act) {
				actionsMap[act] = p;
			}
		});

		return {
			key: modKey,
			module: modKey,
			label: conf.label,
			icon: conf.icon,
			color: conf.color,
			actions: actionsMap,
			items,
		};
	});
}
