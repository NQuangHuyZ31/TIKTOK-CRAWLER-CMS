import React from 'react';
import { AppstoreOutlined } from '@ant-design/icons';
import { getRoutes } from '../../routes/registry';
import { toHeadlineCase } from '../../utils/formatString';
import type { ModuleRow, PermissionInputType, PermissionItem } from './permissionMatrixTypes';

/**
 * Resolves module icon from the frontend Route Registry.
 */
function resolveModuleIcon(modKey: string): React.ReactNode {
	const routes = getRoutes();
	const matched = routes.find((r) => r.module?.toLowerCase() === modKey);
	if (matched?.icon) {
		if (React.isValidElement(matched.icon)) {
			return matched.icon;
		}
		const IconComp = matched.icon as React.ComponentType;
		try {
			return React.createElement(IconComp);
		} catch {
			return React.createElement(AppstoreOutlined);
		}
	}
	return React.createElement(AppstoreOutlined);
}

/**
 * Normalizes any backend permission catalog into a uniform ModuleRow array.
 */
export function normalizePermissions(
	input?: PermissionInputType,
	moduleMetadata?: Record<string, { label?: string; icon?: string; color?: string }>
): ModuleRow[] {
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
		const meta = moduleMetadata?.[modKey];
		const label = meta?.label || toHeadlineCase(modKey);
		const color = meta?.color || 'blue';
		const icon = resolveModuleIcon(modKey);
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
			label,
			icon,
			color,
			actions: actionsMap,
			items,
		};
	});
}
