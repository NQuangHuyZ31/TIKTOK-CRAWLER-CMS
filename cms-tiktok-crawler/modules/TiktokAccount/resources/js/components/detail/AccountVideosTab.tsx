import React, { useMemo } from 'react';
import { Button, Card, Input, Space } from 'antd';
import { ReloadOutlined, SearchOutlined, VideoCameraOutlined } from '@ant-design/icons';
import TableComponent from '@core/components/Table';
import { formatNumber } from '@core/utils/formatNumber';
import { accountVideoColumnConfig } from '../../configs/accountDetailConfig';
import { createAccountVideoColumnRenderers } from './videoColumnRenderers';

interface AccountVideosTabProps {
	data: any[];
	loading: boolean;
	pagination: { page: number; per_page: number; total: number };
	search: string;
	onSearchChange: (value: string) => void;
	onPageChange: (page: number, per_page: number) => void;
	onRefresh: () => void;
}

export default function AccountVideosTab({
	data,
	loading,
	pagination,
	search,
	onSearchChange,
	onPageChange,
	onRefresh,
}: AccountVideosTabProps) {
	const renderColumns = useMemo(() => createAccountVideoColumnRenderers(), []);

	return (
		<Card
			title={
				<Space size={8}>
					<VideoCameraOutlined />
					<span>Danh sách Video đã thu thập ({formatNumber(pagination.total)})</span>
				</Space>
			}
			extra={
				<Space size={8} wrap>
					<Input
						placeholder="Tìm theo mô tả video..."
						prefix={<SearchOutlined />}
						allowClear
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						style={{ width: 220 }}
						size="small"
					/>
					<Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} size="small">
						Làm mới
					</Button>
				</Space>
			}
		>
			<TableComponent
				columns={accountVideoColumnConfig}
				data={data}
				pagination={pagination}
				handlePageChange={onPageChange}
				loading={loading}
				renderColumns={renderColumns}
			/>
		</Card>
	);
}
