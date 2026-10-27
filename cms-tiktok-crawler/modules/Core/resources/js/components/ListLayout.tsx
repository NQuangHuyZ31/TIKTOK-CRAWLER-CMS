import React, { ReactNode, useState, useEffect } from 'react';
import { Card, Input, Select, DatePicker, InputNumber, Radio, Form, Button, Space, Flex, Tooltip } from 'antd';
import { PlusOutlined, ReloadOutlined, ClearOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader, { PageHeaderProps } from './PageHeader';
import TableComponent, { TableComponentProps, TableColumn } from './Table';
import NumericRangeFilter, { NumericPreset } from './NumericRangeFilter';

export type FilterFieldType = 'select' | 'dateRange' | 'date' | 'number' | 'numberRange' | 'radio' | 'text' | 'custom';

export interface FilterItemOption {
	label: string;
	value: string | number | boolean;
}

export interface SearchFieldOption {
	label: string;
	value: string;
}

/**
 * Dynamic filter field configuration rendered by Ant Design Form.Item.
 */
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

/**
 * Streamlined ListLayout properties providing unified PageHeader,
 * dynamic search/filter toolbar, and standardized table rendering.
 */
export interface ListLayoutProps<T = any> {
	// 1. Header Props
	title: ReactNode;
	subtitle?: ReactNode;
	breadcrumbs?: PageHeaderProps['breadcrumbs'];
	onBack?: () => void;

	// Primary Action: Add / Create
	onAdd?: (() => void) | string;
	addText?: string;
	extra?: ReactNode;

	// 2. Search Props
	showSearch?: boolean;
	searchPlaceholder?: string;
	searchValue?: string;
	onSearch?: (keyword: string) => void;

	// 3. Dynamic Filter Props
	filters?: DynamicFilterField[];
	onResetFilters?: () => void;

	// 4. Refresh Action
	onRefresh?: () => void;
	refreshing?: boolean;

	// 5. Card Props
	cardTitle?: ReactNode;

	// 6. Table Props
	columns?: TableColumn<T>[];
	data?: T[];
	loading?: boolean;
	pagination?: TableComponentProps<T>['pagination'];
	onPageChange?: (page: number, pageSize: number) => void;
	renderColumns?: TableComponentProps<T>['renderColumns'];
	rowKey?: string | ((record: T) => string);
	rowSelection?: TableComponentProps<T>['rowSelection'];

	// 7. Child slot (Optional fallback when passing custom table content)
	children?: ReactNode;
}

/**
 * Standardized List Layout component for CMS pages.
 * Integrates PageHeader, dynamic search, Ant Design form filters, and TableComponent.
 */
export default function ListLayout<T = any>({
	// Header props
	title,
	subtitle,
	breadcrumbs,
	onBack,
	onAdd,
	addText = 'Add New',
	extra,

	// Search props
	showSearch = true,
	searchPlaceholder = 'Search...',
	searchValue,
	onSearch,

	// Filter props
	filters = [],
	onResetFilters,

	// Refresh props
	onRefresh,
	refreshing = false,

	// Card props
	cardTitle,

	// Table props
	columns,
	data,
	loading = false,
	pagination,
	onPageChange,
	renderColumns,
	rowKey = 'id',
	rowSelection,

	// Child slot
	children,
}: ListLayoutProps<T>) {
	const navigate = useNavigate();
	const [form] = Form.useForm();

	// Search state
	const [localSearch, setLocalSearch] = useState<string>(searchValue ?? '');

	// Collapsible advanced filters state
	const [expandFilters, setExpandFilters] = useState<boolean>(false);

	// Synchronize external search value
	useEffect(() => {
		if (searchValue !== undefined) {
			setLocalSearch(searchValue);
		}
	}, [searchValue]);

	// Primary header action button
	const primaryAddButton = onAdd ? (
		<Button type="primary" icon={<PlusOutlined />} onClick={() => (typeof onAdd === 'string' ? navigate(onAdd) : onAdd())}>
			{addText}
		</Button>
	) : null;

	// Handle search trigger
	const handleSearchTrigger = (val: string) => {
		onSearch?.(val.trim());
	};

	// Handle filter change
	const handleFormValuesChange = (changedValues: Record<string, any>) => {
		Object.keys(changedValues).forEach((key) => {
			const matchingFilter = filters.find((f) => f.key === key);
			matchingFilter?.onChange?.(changedValues[key]);
		});
	};

	// Handle filter reset
	const handleReset = () => {
		form.resetFields();
		const resetValues = Object.fromEntries(filters.map((filter) => [filter.key, undefined]));
		form.setFieldsValue(resetValues);
		setLocalSearch('');
		onResetFilters?.();
	};

	// Collapsible filter slice
	const primaryFilters = expandFilters ? filters : filters.slice(0, 3);
	const hasCollapsibleFilters = filters.length > 3;

	// Check if toolbar has content
	const hasToolbar = (showSearch && Boolean(onSearch)) || filters.length > 0 || Boolean(onResetFilters) || Boolean(onRefresh);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			{/* 1. Page Header */}
			<PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} onBack={onBack} extra={extra ?? primaryAddButton} />

			{/* 2. Main List Card */}
			<Card
				title={cardTitle}
				style={{
					borderRadius: 12,
					border: '1px solid #edf0f5',
					boxShadow: '0 2px 12px rgba(23, 32, 51, 0.04)',
				}}
				styles={{
					body: {
						padding: columns && data !== undefined ? 0 : 20,
					},
				}}
			>
				{/* 3. Search & Filter Toolbar */}
				{hasToolbar && (
					<div
						style={{
							padding: '16px 20px',
							borderBottom: '1px solid #f0f2f5',
							background: '#fafbfc',
							borderRadius: '12px 12px 0 0',
						}}
					>
						<Flex justify="space-between" align="center" wrap="wrap" gap={12}>
							{/* Left: Search input & Dynamic form filters */}
							<Flex align="center" wrap="wrap" gap={12} style={{ flex: 1 }}>
								{showSearch && onSearch && (
									<Input.Search
										placeholder={searchPlaceholder}
										allowClear
										value={localSearch}
										onChange={(e) => setLocalSearch(e.target.value)}
										onSearch={handleSearchTrigger}
										style={{ maxWidth: 280, minWidth: 200 }}
									/>
								)}

								{filters.length > 0 && (
									<Form form={form} layout="inline" onValuesChange={handleFormValuesChange} style={{ gap: '10px 12px' }}>
										{primaryFilters.map((filter) => {
											let inputComponent: ReactNode = null;

											if (filter.type === 'custom' && filter.render) {
												inputComponent = filter.render(form);
											} else if (filter.type === 'dateRange') {
												inputComponent = <DatePicker.RangePicker allowClear={filter.allowClear ?? true} style={{ minWidth: 240, ...filter.style }} />;
											} else if (filter.type === 'date') {
												inputComponent = <DatePicker placeholder={filter.placeholder} allowClear={filter.allowClear ?? true} style={{ minWidth: 150, ...filter.style }} />;
											} else if (filter.type === 'number') {
												inputComponent = <InputNumber placeholder={filter.placeholder} style={{ minWidth: filter.width ?? 130, ...filter.style }} />;
											} else if (filter.type === 'numberRange') {
												inputComponent = (
													<NumericRangeFilter
														placeholder={filter.placeholder ?? filter.label ?? 'Range'}
														presets={filter.presets}
														width={filter.width ?? 150}
														allowClear={filter.allowClear ?? true}
														style={filter.style}
													/>
												);
											} else if (filter.type === 'radio') {
												inputComponent = <Radio.Group optionType="button" buttonStyle="solid" options={filter.options} />;
											} else {
												inputComponent = (
													<Select
														placeholder={filter.placeholder ?? filter.label ?? 'Filter'}
														options={filter.options}
														allowClear={filter.allowClear ?? true}
														showSearch={filter.showSearch}
														style={{ minWidth: filter.width ?? 160, ...filter.style }}
													/>
												);
											}

											return (
												<Form.Item key={filter.key} name={filter.key} label={filter.label} initialValue={filter.initialValue} style={{ margin: 0 }}>
													{inputComponent}
												</Form.Item>
											);
										})}
									</Form>
								)}

								{(onResetFilters || filters.length > 0) && (
									<Button icon={<ClearOutlined />} onClick={handleReset}>
										Reset
									</Button>
								)}

								{hasCollapsibleFilters && (
									<Button type="link" size="small" onClick={() => setExpandFilters(!expandFilters)} style={{ fontSize: 13, padding: 0 }}>
										{expandFilters ? (
											<>
												Collapse <UpOutlined />
											</>
										) : (
											<>
												Advanced ({filters.length}) <DownOutlined />
											</>
										)}
									</Button>
								)}
							</Flex>

							{/* Right: Refresh button */}
							{onRefresh && (
								<Tooltip title="Refresh data">
									<Button icon={<ReloadOutlined spin={refreshing} />} onClick={onRefresh} loading={refreshing} />
								</Tooltip>
							)}
						</Flex>
					</div>
				)}

				{/* 4. Table Component */}
				{columns && data !== undefined ? (
					<TableComponent<T> columns={columns} data={data} loading={loading} pagination={pagination} handlePageChange={onPageChange} renderColumns={renderColumns} rowKey={rowKey} rowSelection={rowSelection} />
				) : (
					children
				)}
			</Card>
		</div>
	);
}
