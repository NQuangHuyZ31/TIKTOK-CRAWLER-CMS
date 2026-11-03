import React, { useState } from 'react';
import { Button, Flex, Form, Input, Tooltip } from 'antd';
import { ClearOutlined, DownOutlined, ReloadOutlined, UpOutlined } from '@ant-design/icons';
import ListLayoutFilterField from './ListLayoutFilterField';
import type { DynamicFilterField } from './listLayoutTypes';

export interface ListLayoutToolbarProps {
	showSearch?: boolean;
	onSearch?: (keyword: string) => void;
	searchPlaceholder?: string;
	localSearch: string;
	onSearchChange: (val: string) => void;
	filters?: DynamicFilterField[];
	form: any;
	onValuesChange: (changedValues: Record<string, any>) => void;
	onReset: () => void;
	onRefresh?: () => void;
	refreshing?: boolean;
}

export default function ListLayoutToolbar({
	showSearch = true,
	onSearch,
	searchPlaceholder = 'Search...',
	localSearch,
	onSearchChange,
	filters = [],
	form,
	onValuesChange,
	onReset,
	onRefresh,
	refreshing = false,
}: ListLayoutToolbarProps) {
	const [expandFilters, setExpandFilters] = useState<boolean>(false);
	const primaryFilters = expandFilters ? filters : filters.slice(0, 3);
	const hasCollapsibleFilters = filters.length > 3;

	return (
		<div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', background: '#fafbfc', borderRadius: '12px 12px 0 0' }}>
			<Flex justify="space-between" align="center" wrap="wrap" gap={12}>
				<Flex align="center" wrap="wrap" gap={12} style={{ flex: 1 }}>
					{showSearch && onSearch && (
						<Input.Search
							placeholder={searchPlaceholder}
							allowClear
							value={localSearch}
							onChange={(e) => onSearchChange(e.target.value)}
							onSearch={(val) => onSearch(val.trim())}
							style={{ maxWidth: 280, minWidth: 200 }}
						/>
					)}

					{filters.length > 0 && (
						<Form form={form} layout="inline" onValuesChange={onValuesChange} style={{ gap: '10px 12px' }}>
							{primaryFilters.map((filter) => (
								<ListLayoutFilterField key={filter.key} filter={filter} form={form} />
							))}
						</Form>
					)}

					{filters.length > 0 && (
						<Button icon={<ClearOutlined />} onClick={onReset}>
							Reset
						</Button>
					)}

					{hasCollapsibleFilters && (
						<Button type="link" size="small" onClick={() => setExpandFilters(!expandFilters)} style={{ fontSize: 13, padding: 0 }}>
							{expandFilters ? (
								<>Collapse <UpOutlined /></>
							) : (
								<>Advanced ({filters.length}) <DownOutlined /></>
							)}
						</Button>
					)}
				</Flex>

				{onRefresh && (
					<Tooltip title="Refresh data">
						<Button icon={<ReloadOutlined spin={refreshing} />} onClick={onRefresh} loading={refreshing} />
					</Tooltip>
				)}
			</Flex>
		</div>
	);
}
