import React from 'react';

export interface PermissionItem {
	id: number;
	name: string;
	slug: string;
	module?: string;
	action?: string;
	description?: string;
}

export type PermissionInputType =
	| Record<string, PermissionItem[]>
	| Array<{ module: string; items: PermissionItem[] }>
	| PermissionItem[];

export interface ModuleRow {
	key: string;
	module: string;
	label: string;
	icon: React.ReactNode;
	color: string;
	actions: Record<string, PermissionItem>;
	items: PermissionItem[];
}
