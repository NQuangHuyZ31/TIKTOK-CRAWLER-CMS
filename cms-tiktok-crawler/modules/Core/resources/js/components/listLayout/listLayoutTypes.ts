import { ReactNode } from 'react';
import type { PageHeaderProps } from '../PageHeader';
import type { TableComponentProps, TableColumn } from '../Table';
import type { NumericPreset } from '../NumericRangeFilter';

export type FilterFieldType = 'select' | 'dateRange' | 'date' | 'number' | 'numberRange' | 'radio' | 'text' | 'custom';

export interface FilterItemOption {
	label: string;
	value: string | number | boolean;
}

export interface SearchFieldOption {
	label: string;
	value: string;
}

export interface DynamicFilterField {
	key: string;
	label?: string;
	type?: FilterFieldType;
	placeholder?: string;
	options?: FilterItemOption[];
	presets?: NumericPreset[];
	initialValue?: any;
	value?: any;
	onChange?: (value: any) => void;
	width?: number | string;
	allowClear?: boolean;
	showSearch?: boolean;
	render?: (form: any) => ReactNode;
	style?: React.CSSProperties;
}

export type FilterItemConfig = DynamicFilterField;

export interface ListLayoutProps<T = any> {
	title: ReactNode;
	subtitle?: ReactNode;
	breadcrumbs?: PageHeaderProps['breadcrumbs'];
	onBack?: () => void;

	onAdd?: (() => void) | string;
	addText?: string;
	extra?: ReactNode;

	showSearch?: boolean;
	searchPlaceholder?: string;
	searchValue?: string;
	onSearch?: (keyword: string) => void;

	filters?: DynamicFilterField[];
	onResetFilters?: () => void;

	onRefresh?: () => void;
	refreshing?: boolean;

	cardTitle?: ReactNode;
	topContent?: ReactNode;

	columns?: TableColumn<T>[];
	data?: T[];
	loading?: boolean;
	pagination?: TableComponentProps<T>['pagination'];
	onPageChange?: (page: number, pageSize: number) => void;
	renderColumns?: TableComponentProps<T>['renderColumns'];
	rowKey?: string | ((record: T) => string);
	rowSelection?: TableComponentProps<T>['rowSelection'];

	onEdit?: (record: T) => void;
	onDelete?: (record: T) => void;
	canEdit?: boolean | ((record: T) => boolean);
	canDelete?: boolean | ((record: T) => boolean);
	deleteConfirmTitle?: string | ((record: T) => React.ReactNode);
	extraActions?: (record: T) => React.ReactNode;
	permissionModule?: string;

	children?: ReactNode;
}
