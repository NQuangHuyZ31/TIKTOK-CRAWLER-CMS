import React, { useState, useEffect } from 'react';
import { Button, Card, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';
import TableComponent from './Table';
import type {
	FilterFieldType,
	FilterItemOption,
	SearchFieldOption,
	DynamicFilterField,
	FilterItemConfig,
	ListLayoutProps,
} from './listLayout/listLayoutTypes';
import ListLayoutToolbar from './listLayout/ListLayoutToolbar';

export type {
	FilterFieldType,
	FilterItemOption,
	SearchFieldOption,
	DynamicFilterField,
	FilterItemConfig,
	ListLayoutProps,
};

export default function ListLayout<T = any>({
	title,
	subtitle,
	breadcrumbs,
	onBack,
	onAdd,
	addText = 'Add New',
	extra,
	showSearch = true,
	searchPlaceholder = 'Search...',
	searchValue,
	onSearch,
	filters = [],
	onResetFilters,
	onRefresh,
	refreshing = false,
	cardTitle,
	topContent,
	columns,
	data,
	loading = false,
	pagination,
	onPageChange,
	renderColumns,
	rowKey = 'id',
	rowSelection,
	onEdit,
	onDelete,
	canEdit,
	canDelete,
	deleteConfirmTitle,
	extraActions,
	permissionModule,
	children,
}: ListLayoutProps<T>) {
	const navigate = useNavigate();
	const [form] = Form.useForm();
	const [localSearch, setLocalSearch] = useState<string>(searchValue ?? '');

	useEffect(() => {
		if (searchValue !== undefined) {
			setLocalSearch(searchValue);
		}
	}, [searchValue]);

	const primaryAddButton = onAdd ? (
		<Button type="primary" icon={<PlusOutlined />} onClick={() => (typeof onAdd === 'string' ? navigate(onAdd) : onAdd())}>
			{addText}
		</Button>
	) : null;

	const handleFormValuesChange = (changedValues: Record<string, any>) => {
		Object.keys(changedValues).forEach((key) => {
			const matchingFilter = filters.find((f) => f.key === key);
			matchingFilter?.onChange?.(changedValues[key]);
		});
	};

	const handleReset = () => {
		form.resetFields();
		const resetValues = Object.fromEntries(filters.map((filter) => [filter.key, undefined]));
		form.setFieldsValue(resetValues);
		setLocalSearch('');
		onResetFilters?.();
	};

	const hasToolbar = (showSearch && Boolean(onSearch)) || filters.length > 0 || Boolean(onResetFilters) || Boolean(onRefresh);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} onBack={onBack} extra={extra ?? primaryAddButton} />
			{topContent}
			<Card
				title={cardTitle}
				style={{ borderRadius: 12, border: '1px solid #edf0f5', boxShadow: '0 2px 12px rgba(23, 32, 51, 0.04)' }}
				styles={{ body: { padding: columns && data !== undefined ? 0 : 20 } }}
			>
				{hasToolbar && (
					<ListLayoutToolbar
						showSearch={showSearch}
						onSearch={onSearch}
						searchPlaceholder={searchPlaceholder}
						localSearch={localSearch}
						onSearchChange={setLocalSearch}
						filters={filters}
						form={form}
						onValuesChange={handleFormValuesChange}
						onReset={handleReset}
						onRefresh={onRefresh}
						refreshing={refreshing}
					/>
				)}

				{columns && data !== undefined ? (
					<TableComponent<T>
						columns={columns}
						data={data}
						loading={loading}
						pagination={pagination}
						handlePageChange={onPageChange}
						renderColumns={renderColumns}
						rowKey={rowKey}
						rowSelection={rowSelection}
						onEdit={onEdit}
						onDelete={onDelete}
						canEdit={canEdit}
						canDelete={canDelete}
						deleteConfirmTitle={deleteConfirmTitle}
						extraActions={extraActions}
						permissionModule={permissionModule}
					/>
				) : (
					children
				)}
			</Card>
		</div>
	);
}
