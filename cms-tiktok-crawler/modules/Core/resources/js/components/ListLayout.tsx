import React, { ReactNode, useState, useEffect } from 'react';
import { Card, Input, Select, DatePicker, InputNumber, Radio, Form, Button, Space, Flex, Tooltip, Badge, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined, ClearOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader, { PageHeaderProps } from './PageHeader';
import TableComponent, { TableComponentProps, TableColumn } from './Table';
import EmptyState from './EmptyState';

const { Text } = Typography;

/**
 * Filter item types supported dynamically by Ant Design Form controls.
 */
export type FilterFieldType = 'select' | 'dateRange' | 'date' | 'number' | 'radio' | 'text' | 'custom';

export interface FilterItemOption {
	label: string;
	value: string | number | boolean;
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
	initialValue?: any;
	value?: any;
	onChange?: (value: any) => void;
	width?: number | string;
	allowClear?: boolean;
	showSearch?: boolean;
	render?: (form: any) => ReactNode;
	style?: React.CSSProperties;
}

/**
 * Backwards compatibility alias for FilterItemConfig
 */
export type FilterItemConfig = DynamicFilterField;

/**
 * Options for selecting which field to search against.
 */
export interface SearchFieldOption {
	label: string;
	value: string;
}

/**
 * Unified ListLayout properties supporting dynamic search, dynamic filters,
 * dynamic column rendering, and table management using built-in Ant Design components.
 */
export interface ListLayoutProps<T = any> {
	// 1. Page Header Props
	title: ReactNode;
	subtitle?: ReactNode;
	description?: ReactNode;
	breadcrumbs?: PageHeaderProps['breadcrumbs'];
	onBack?: () => void;

	// Primary Action: Add / Create
	onAdd?: (() => void) | string;
	addText?: string;
	addIcon?: ReactNode;
	addDisabled?: boolean;
	headerExtra?: ReactNode;

	// 2. Dynamic Search Props (Ant Design Input.Search)
	showSearch?: boolean;
	searchPlaceholder?: string;
	searchValue?: string;
	searchFields?: SearchFieldOption[];
	selectedSearchField?: string;
	onSearchFieldChange?: (field: string) => void;
	onSearch?: (keyword: string, field?: string) => void;

	// 3. Dynamic Filter Form Props (Ant Design Form)
	filters?: DynamicFilterField[];
	filterValues?: Record<string, any>;
	onFilterChange?: (values: Record<string, any>) => void;
	onResetFilters?: () => void;

	// 4. General Actions
	onRefresh?: () => void;
	refreshing?: boolean;
	toolbarExtra?: ReactNode;

	// 5. Selection & Batch Actions
	selectedRowKeys?: React.Key[];
	batchActions?: ReactNode;

	// 6. Card Presentation Props
	cardTitle?: ReactNode;
	cardExtra?: ReactNode;
	cardStyle?: React.CSSProperties;

	// 7. Dynamic Table Columns & TableComponent Props
	columns?: TableColumn<T>[];
	data?: T[];
	loading?: boolean;
	pagination?: TableComponentProps<T>['pagination'];
	onPageChange?: (page: number, pageSize: number) => void;
	renderColumns?: TableComponentProps<T>['renderColumns'];
	prependColumns?: TableColumn<T>[];
	extraColumns?: TableColumn<T>[];
	rowKey?: string | ((record: T) => string);
	rowSelection?: TableComponentProps<T>['rowSelection'];
	size?: 'small' | 'middle' | 'large';
	emptyDescription?: string;
	emptyActionText?: string;
	onEmptyAction?: () => void;

	// 8. Child slot (Optional fallback when passing custom child table)
	children?: ReactNode;
}

/**
 * Unified List Layout for all modules in CMS TikTok Crawler.
 *
 * Utilizes standard Ant Design components for:
 * 1. Dynamic Search (Input.Search with optional target field selector)
 * 2. Dynamic Filter Form (Ant Design Form with Select, DatePicker, Radio, InputNumber)
 * 3. Dynamic Table Columns Rendering (directly renders passed TableColumn<T>[] into TableComponent)
 */
export default function ListLayout<T = any>({
	// Header props
	title,
	subtitle,
	description,
	breadcrumbs,
	onBack,
	onAdd,
	addText = 'Add New',
	addIcon = <PlusOutlined />,
	addDisabled = false,
	headerExtra,

	// Dynamic Search props
	showSearch = true,
	searchPlaceholder = 'Search...',
	searchValue,
	searchFields,
	selectedSearchField,
	onSearchFieldChange,
	onSearch,

	// Dynamic Filter props
	filters = [],
	filterValues,
	onFilterChange,
	onResetFilters,

	// General actions
	onRefresh,
	refreshing = false,
	toolbarExtra,

	// Batch actions
	selectedRowKeys = [],
	batchActions,

	// Card props
	cardTitle,
	cardExtra,
	cardStyle,

	// Dynamic Table Columns & Table props
	columns,
	data,
	loading = false,
	pagination,
	onPageChange,
	renderColumns,
	prependColumns,
	extraColumns,
	rowKey = 'id',
	rowSelection,
	size = 'middle',
	emptyDescription = 'No records found',
	emptyActionText,
	onEmptyAction,

	// Child slot
	children,
}: ListLayoutProps<T>) {
	const navigate = useNavigate();
	const [form] = Form.useForm();

	// Search state
	const [localSearch, setLocalSearch] = useState<string>(searchValue ?? '');
	const [currentSearchField, setCurrentSearchField] = useState<string>(selectedSearchField ?? searchFields?.[0]?.value ?? '');

	// Collapsible advanced filters state
	const [expandFilters, setExpandFilters] = useState<boolean>(false);

	// Synchronize external search value
	useEffect(() => {
		if (searchValue !== undefined) {
			setLocalSearch(searchValue);
		}
	}, [searchValue]);

	// Synchronize external filter values with Antd Form
	useEffect(() => {
		if (filterValues) {
			form.setFieldsValue(filterValues);
		} else {
			const individualValues: Record<string, any> = {};
			filters.forEach((f) => {
				if (f.value !== undefined) {
					individualValues[f.key] = f.value;
				}
			});
			if (Object.keys(individualValues).length > 0) {
				form.setFieldsValue(individualValues);
			}
		}
	}, [filterValues, filters, form]);

	// Handle add button click
	const handleAddClick = () => {
		if (typeof onAdd === 'string') {
			navigate(onAdd);
		} else if (typeof onAdd === 'function') {
			onAdd();
		}
	};

	// Handle search trigger
	const handleSearchTrigger = (val: string) => {
		if (onSearch) {
			onSearch(val.trim(), currentSearchField || undefined);
		}
	};

	// Handle filter form values change
	const handleFormValuesChange = (changedValues: any, allValues: any) => {
		Object.keys(changedValues).forEach((key) => {
			const matchingFilter = filters.find((f) => f.key === key);
			matchingFilter?.onChange?.(changedValues[key]);
		});
		if (onFilterChange) {
			onFilterChange(allValues);
		}
	};

	// Handle filter reset
	const handleReset = () => {
		// Reset all form fields.
		form.resetFields();

		// Clear the values displayed by the filters.
		const resetValues = Object.fromEntries(filters.map((filter) => [filter.key, undefined]));

		form.setFieldsValue(resetValues);

		setLocalSearch('');
		onResetFilters?.();
	};

	// Primary header action button
	const primaryAddButton = onAdd ? (
		<Button type="primary" icon={addIcon} disabled={addDisabled} onClick={handleAddClick}>
			{addText}
		</Button>
	) : null;

	// Render dynamic search input with optional target field addon
	const searchAddonBefore =
		searchFields && searchFields.length > 0 ? (
			<Select
				value={currentSearchField}
				onChange={(val) => {
					setCurrentSearchField(val);
					onSearchFieldChange?.(val);
				}}
				style={{ width: 110 }}
				options={searchFields}
			/>
		) : undefined;

	// Number of visible filters before collapse
	const primaryFilters = expandFilters ? filters : filters.slice(0, 3);
	const hasCollapsibleFilters = filters.length > 3;

	// Determine if toolbar has any elements to display
	const hasToolbar = (showSearch && Boolean(onSearch)) || filters.length > 0 || Boolean(onResetFilters) || Boolean(onRefresh) || Boolean(toolbarExtra) || (selectedRowKeys && selectedRowKeys.length > 0);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			{/* 1. Standardized PageHeader */}
			<PageHeader
				title={title}
				subtitle={subtitle ?? description}
				breadcrumbs={breadcrumbs}
				onBack={onBack}
				extra={
					<Space wrap size={12}>
						{headerExtra}
						{primaryAddButton}
					</Space>
				}
			/>

			{/* 2. List Card Container */}
			<Card
				title={cardTitle}
				extra={cardExtra}
				style={{
					borderRadius: 12,
					border: '1px solid #edf0f5',
					boxShadow: '0 2px 12px rgba(23, 32, 51, 0.04)',
					...cardStyle,
				}}
				styles={{
					body: {
						padding: columns && data !== undefined ? 0 : 20,
					},
				}}
			>
				{/* 3. Dynamic Search & Filter Toolbar */}
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
							{/* Left: Dynamic Search & Dynamic Form Filters */}
							<Flex align="center" wrap="wrap" gap={12} style={{ flex: 1 }}>
								{/* Dynamic Keyword Search using Antd Input.Search */}
								{showSearch && onSearch && (
									<Input.Search
										addonBefore={searchAddonBefore}
										placeholder={searchPlaceholder}
										allowClear
										value={localSearch}
										onChange={(e) => setLocalSearch(e.target.value)}
										onSearch={handleSearchTrigger}
										style={{ maxWidth: searchAddonBefore ? 380 : 280, minWidth: 220 }}
									/>
								)}

								{/* Dynamic Filters Form using Antd Form */}
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
											} else if (filter.type === 'radio') {
												inputComponent = <Radio.Group optionType="button" buttonStyle="solid" options={filter.options} />;
											} else {
												// Default: 'select'
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

								{/* Reset Filters button */}
								{(onResetFilters || filters.length > 0) && (
									<Button icon={<ClearOutlined />} onClick={handleReset}>
										Reset
									</Button>
								)}

								{/* Expand / Collapse advanced filters */}
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

							{/* Right: Batch Actions, Refresh Button & Toolbar Extra */}
							<Flex align="center" gap={10}>
								{/* Batch actions indicator */}
								{selectedRowKeys.length > 0 && (
									<Space size={8} align="center">
										<Badge count={selectedRowKeys.length} style={{ backgroundColor: '#1677ff' }} />
										<Text type="secondary" style={{ fontSize: 13 }}>
											selected
										</Text>
										{batchActions}
									</Space>
								)}

								{toolbarExtra}

								{/* Refresh Button */}
								{onRefresh && (
									<Tooltip title="Refresh data">
										<Button icon={<ReloadOutlined spin={refreshing} />} onClick={onRefresh} loading={refreshing} />
									</Tooltip>
								)}
							</Flex>
						</Flex>
					</div>
				)}

				{/* 4. Table Rendering: directly renders dynamic columns into TableComponent or custom children */}
				{columns && data !== undefined ? (
					<TableComponent<T>
						columns={columns}
						data={data}
						loading={loading}
						pagination={pagination}
						handlePageChange={onPageChange}
						renderColumns={renderColumns}
						prependColumns={prependColumns}
						extraColumns={extraColumns}
						rowKey={rowKey}
						rowSelection={rowSelection}
						size={size}
						locale={{
							emptyText: <EmptyState description={emptyDescription} actionText={emptyActionText ?? (onAdd ? addText : undefined)} onAction={onEmptyAction ?? (onAdd ? handleAddClick : undefined)} />,
						}}
					/>
				) : (
					children
				)}
			</Card>
		</div>
	);
}
