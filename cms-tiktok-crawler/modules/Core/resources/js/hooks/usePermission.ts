import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

interface CanCheckOptions {
	module?: string;
	action?: PermissionAction;
	slug?: string;
	role?: string | string[];
}

export default function usePermission() {
	const { roles, modulePermissions, permissions } = useSelector((state: any) => state.auth);
	const isAdmin = useMemo(() => roles?.includes('admin'), [roles]);

	/** Check role */
	const hasRole = useCallback((requiredRole: string | string[]): boolean => {
		if (isAdmin) return true;

		if (!requiredRole || !roles) return false;

		const checkList = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

		return checkList.some((r) => roles.includes(r));
	}, [isAdmin, roles]);

	/** Check slug */
	const hasPermission = useCallback((slug: string): boolean => {
		if (isAdmin) return true;

		return permissions?.includes(slug) ?? false;
	}, [isAdmin, permissions]);

	/** Check CRUD for module */
	const canDoModule = useCallback((module: string, action: PermissionAction = 'view'): boolean => {
		if (isAdmin) return true;
		if (module === 'core' || module === 'auth') return true;

		const targetPerms = modulePermissions?.[module];

		if (!targetPerms) return false;

		if (targetPerms[action] === true) return true;
		if (action === 'edit' && targetPerms.edit === true) {
			return true;
		}

		if (action === 'view' && (targetPerms.edit === true || targetPerms.create === true)) {
			return true;
		}

		return false;
	}, [isAdmin, modulePermissions]);

	/** Can */
	const can = useCallback((options: CanCheckOptions): boolean => {
		if (isAdmin) return true;

		if (options.role && !hasRole(options.role)) {
			return false;
		}

		if (options.slug && !hasPermission(options.slug)) {
			return false;
		}

		if (options.module && !canDoModule(options.module, options.action || 'view')) {
			return false;
		}

		return true;
	}, [isAdmin, hasRole, hasPermission, canDoModule]);

	return {
		hasRole,
		hasPermission,
		canDoModule,
		can,
		isAdmin,
	};
}
