import { useMemo, useSyncExternalStore } from 'react';
import { useRoutes, type RouteDef } from './registry';

export const PROTECTED_MODULES = ['core', 'auth', 'system', 'guideline'] as const;

export interface ToggleableModuleInfo {
	key: string;
	name: string;
	path: string;
	routeCount: number;
	description?: string;
	order: number;
}

type VisibilityState = {
	hiddenModules: readonly string[];
	listeners: Set<() => void>;
};

const normalizeList = (list: unknown): string[] => {
	if (!Array.isArray(list)) return [];
	const set = new Set<string>();
	for (const item of list) {
		if (typeof item === 'string') {
			const clean = item.trim().toLowerCase();
			if (clean && !(PROTECTED_MODULES as readonly string[]).includes(clean)) {
				set.add(clean);
			}
		}
	}
	return Array.from(set);
};

const getState = (): VisibilityState => {
	const w = window as unknown as {
		__CMS_HIDDEN_MODULES__?: unknown;
		__CMS_MODULE_VISIBILITY_STATE__?: VisibilityState;
	};

	if (!w.__CMS_MODULE_VISIBILITY_STATE__) {
		w.__CMS_MODULE_VISIBILITY_STATE__ = {
			hiddenModules: normalizeList(w.__CMS_HIDDEN_MODULES__),
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
	if ((PROTECTED_MODULES as readonly string[]).includes(clean)) return false;
	return hiddenList.includes(clean);
}

export function useHiddenModules(): readonly string[] {
	return useSyncExternalStore(subscribeModuleVisibility, () => getState().hiddenModules);
}

const formatModuleKey = (key: string): string =>
	key
		.split(/[_-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

/**
 * Auto-discovers toggleable modules from the registered route registry.
 * Protected core modules (core, auth, system) are excluded.
 */
export function useToggleableModules(): ToggleableModuleInfo[] {
	const routes = useRoutes();

	return useMemo(() => {
		const grouped = new Map<string, RouteDef[]>();

		for (const route of routes) {
			if (!route.module) continue;
			const key = route.module.trim().toLowerCase();
			if (!key || (PROTECTED_MODULES as readonly string[]).includes(key)) continue;

			const list = grouped.get(key) ?? [];
			list.push(route);
			grouped.set(key, list);
		}

		const result: ToggleableModuleInfo[] = [];

		grouped.forEach((modRoutes, key) => {
			const sorted = [...modRoutes].sort((a, b) => {
				const aHasLabel = a.label ? 0 : 1;
				const bHasLabel = b.label ? 0 : 1;
				if (aHasLabel !== bHasLabel) return aHasLabel - bHasLabel;
				return (a.order ?? 100) - (b.order ?? 100);
			});

			const primary = sorted[0];
			const metaDesc = typeof primary.meta?.description === 'string' ? primary.meta.description : undefined;

			result.push({
				key,
				name: primary.label || primary.title || formatModuleKey(key),
				path: primary.path,
				routeCount: modRoutes.length,
				description: metaDesc,
				order: primary.order ?? 100,
			});
		});

		return result.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
	}, [routes]);
}
