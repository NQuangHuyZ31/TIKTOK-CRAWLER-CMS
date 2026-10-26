import React from 'react';
import { useSelector } from '@core/store';
import PermissionMatrix, { PermissionMatrixProps } from '@core/components/PermissionMatrix';

/**
 * Reusable User Module Permission Matrix Selector.
 * Re-uses Core's universal Table-based PermissionMatrix with dynamic backend permission catalog,
 * completely eliminating code duplication and hardcoded arrays.
 */
export default function PermissionMatrixSelector(props: Partial<PermissionMatrixProps>) {
    const { groupedPermissionsCatalog, permissionsCatalog } = useSelector((state: any) => state.user);
    const catalog =
        props.permissions ??
        (groupedPermissionsCatalog && groupedPermissionsCatalog.length > 0
            ? groupedPermissionsCatalog
            : permissionsCatalog) ??
        [];

    return (
        <PermissionMatrix
            permissions={catalog}
            mode="slug"
            title="User Module Permission Overrides"
            {...props}
        />
    );
}

export { default as PermissionMatrix } from '@core/components/PermissionMatrix';
export * from '@core/components/PermissionMatrix';

