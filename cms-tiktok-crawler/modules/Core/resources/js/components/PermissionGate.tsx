import React from 'react';
import usePermission, { PermissionAction } from '../hooks/usePermission';

export interface PermissionGateProps {
	children: React.ReactNode;
	module?: string;
	action?: PermissionAction;
	slug?: string;
	roles?: string | string[];
	fallback?: React.ReactNode;
}

/**
 * Universal PermissionGate component for RBAC conditional rendering.
 * Checks authentication Redux state for super admin, specific permission slug, or module:action access.
 *
 * Example usage:
 * <PermissionGate module="crawler" action="edit">
 *     <Button type="primary">Start Crawl Job</Button>
 * </PermissionGate>
 */
export default function PermissionGate({ children, module, action = 'view', slug, roles, fallback = null }: PermissionGateProps) {
	const { can } = usePermission();

	const allowed = can({ module, action, slug, role: roles });

	return allowed ? <>{children}</> : <>{fallback}</>;
}
