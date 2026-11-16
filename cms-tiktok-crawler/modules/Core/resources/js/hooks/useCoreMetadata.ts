import { useEffect, useState, useCallback, useMemo } from 'react';
import { getCoreMetadata, type CoreMetadata, type PermissionActionItem } from '../Action/core';

let cachedMetadata: CoreMetadata | null = null;
let fetchPromise: Promise<CoreMetadata | null> | null = null;

export function useCoreMetadata() {
	const [metadata, setMetadata] = useState<CoreMetadata | null>(cachedMetadata);
	const [loading, setLoading] = useState<boolean>(!cachedMetadata);

	const load = useCallback((force = false) => {
		if (!force && cachedMetadata) {
			setMetadata(cachedMetadata);
			setLoading(false);
			return;
		}

		if (force) {
			cachedMetadata = null;
			fetchPromise = null;
		}

		if (!fetchPromise) {
			fetchPromise = getCoreMetadata()
				.then((res) => {
					cachedMetadata = res.data;
					return res.data;
				})
				.catch((err) => {
					console.error('Failed to load core metadata:', err);
					return null;
				})
				.finally(() => {
					fetchPromise = null;
				});
		}

		setLoading(true);
		fetchPromise.then((data) => {
			if (data) setMetadata(data);
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		load(false);
	}, [load]);

	const permissionActions: PermissionActionItem[] = metadata?.permission_actions ?? [];
	const basicActions = useMemo(() => {
		const filtered = permissionActions.filter((a) => a.basic).map((a) => a.value);
		return filtered.length > 0 ? filtered : [];
	}, [permissionActions]);

	return {
		metadata,
		loading,
		modules: metadata?.modules ?? [],
		permissionActions,
		basicActions,
		protectedModules: metadata?.protected_modules ?? [],
		ignoreGroup: metadata?.ignore_group ?? [],
		devOnlyActions: metadata?.dev_only_actions ?? {},
		enableDev: metadata?.enable_dev ?? false,
		moduleMetadata: metadata?.module_metadata ?? {},
		refresh: () => load(true),
	};
}
