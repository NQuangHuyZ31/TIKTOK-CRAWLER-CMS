import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRoutes } from './registry';
import { toHeadlineCase } from '../utils/formatString';
import { getDistinctModules } from '@modules/Permission/resources/js/Action/permission';

export interface ToggleableModuleInfo {
	key: string;
	name: string;
	path: string;
	routeCount: number;
	description?: string;
	order: number;
	isProtected: boolean;
}

type VisibilityState = {
	hiddenModules: readonly string[];
	listeners: Set<() => void>;
};

export const getProtectedModules = (): string[] => {
	const w = window as unknown as { __CMS_CONFIG__?: { protectedModules?: string[] } };
	return w.__CMS_CONFIG__?.protectedModules ?? ['core', 'auth', 'system', 'module_manager'];
};

export function isProtectedModule(moduleName?: string): boolean {
	if (!moduleName) return false;
	const clean = moduleName.trim().toLowerCase();
	return getProtectedModules().map((m) => m.toLowerCase()).includes(clean);
}

const normalizeList = (list: unknown): string[] => {
	if (!Array.isArray(list)) return [];
	const set = new Set<string>();
	for (const item of list) {
		if (typeof item === 'string') {
			const clean = item.trim().toLowerCase();
			if (clean && !isProtectedModule(clean)) {
				set.add(clean);
			}
		}
	}
	return Array.from(set);
};

const getState = (): VisibilityState => {
	const w = window as unknown as {
		__CMS_CONFIG__?: { hiddenModules?: unknown };
		__CMS_HIDDEN_MODULES__?: unknown;
		__CMS_MODULE_VISIBILITY_STATE__?: VisibilityState;
	};

	if (!w.__CMS_MODULE_VISIBILITY_STATE__) {
		const initial = w.__CMS_CONFIG__?.hiddenModules ?? w.__CMS_HIDDEN_MODULES__;
		w.__CMS_MODULE_VISIBILITY_STATE__ = {
			hiddenModules: normalizeList(initial),
			listeners: new Set(),
		};
	}

	return w.__CMS_MODULE_VISIBILITY_STATE__;
};

const emit = () => {
	getState().listeners.forEach((listener) => listener());
};

export const subscribeModuleVisibility = (listener: () => void) => {
	const state = getState();
	state.listeners.add(listener);
	return () => state.listeners.delete(listener);
};

export function getHiddenModules(): readonly string[] {
	return getState().hiddenModules;
}

export function setHiddenModules(modules: string[]): void {
	const state = getState();
	const normalized = normalizeList(modules);
	state.hiddenModules = normalized;
	(window as unknown as { __CMS_HIDDEN_MODULES__?: string[] }).__CMS_HIDDEN_MODULES__ = normalized;
	emit();
}

export function isModuleHidden(moduleName?: string, hiddenList: readonly string[] = getHiddenModules()): boolean {
	if (!moduleName) return false;
	const clean = moduleName.trim().toLowerCase();
	if (isProtectedModule(clean)) return false;
	return hiddenList.includes(clean);
}

export function useHiddenModules(): readonly string[] {
	return useSyncExternalStore(subscribeModuleVisibility, () => getState().hiddenModules);
}

/**
 * Auto-discovers modules from backend distinctModules merged with registered route registry.
 * Protected core modules configured in backend are marked with `isProtected: true`.
 * If `ignore: true`, filters out ignored modules defined in config('modules.ignore_group').
 */
export function useToggleableModules(ignore: boolean = false): ToggleableModuleInfo[] {
	const routes = useRoutes();
	const [distinctKeys, setDistinctKeys] = useState<string[]>([]);

	useEffect(() => {
		let isMounted = true;
		getDistinctModules({ ignore })
			.then((res) => {
				if (isMounted && Array.isArray(res?.data)) {
					setDistinctKeys(res.data);
				}
			})
			.catch(() => {});

		return () => {
			isMounted = false;
		};
	}, [ignore]);

	return useMemo(() => {
		const routeKeys = Array.from(new Set(routes.map((r) => r.module?.toLowerCase()).filter(Boolean))) as string[];
		const allKeys = Array.from(new Set([...distinctKeys, ...routeKeys]));

		return allKeys
			.map((key) => {
				const modRoutes = routes.filter((r) => r.module?.toLowerCase() === key.toLowerCase());
				const primary = modRoutes[0];
				return {
					key,
					name: primary?.label || primary?.title || toHeadlineCase(key),
					path: primary?.path || '#',
					routeCount: modRoutes.length,
					description: primary?.meta?.description as string | undefined,
					order: primary?.order ?? 100,
					isProtected: isProtectedModule(key),
				};
			})
			.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
	}, [routes, distinctKeys]);
}
