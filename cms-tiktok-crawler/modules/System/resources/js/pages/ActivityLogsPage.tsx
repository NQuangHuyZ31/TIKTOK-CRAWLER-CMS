import React, { useEffect } from 'react';
import { Col, Row } from 'antd';
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	FieldTimeOutlined,
	UnorderedListOutlined,
} from '@ant-design/icons';
import ListLayout, { DynamicFilterField } from '@core/components/ListLayout';
import CardKPI from '@core/components/CardKPI';
import { useDispatch, useSelector } from '@core/store';
import type { ActivityLogItem } from '../Action/activityLog';
import {
	setActivityParams,
	resetActivityParams,
	setSelectedActivity,
	setDetailModalOpen,
} from '../store/system/systemSlice';
import { fetchActivityLogs, fetchActivityStatistics } from '../store/system/systemThunks';
import ActivityLogTable from '../components/ActivityLogTable';
import ActivityLogDetailModal from '../components/ActivityLogDetailModal';

export default function ActivityLogsPage() {
	const dispatch = useDispatch();
	const {
		activityLogs,
		activityLoading,
		activityPagination,
		activityParams,
		activityStats,
		selectedActivity,
		detailModalOpen,
	} = useSelector((state) => state.system);

	useEffect(() => {
		dispatch(fetchActivityLogs(activityParams));
	}, [dispatch, activityParams]);

	useEffect(() => {
		dispatch(fetchActivityStatistics());
	}, [dispatch]);

	const handleSearch = (val: string) => {
		dispatch(setActivityParams({ search: val.trim() || undefined, page: 1 }));
	};

	const handleViewDetail = (item: ActivityLogItem) => {
		dispatch(setSelectedActivity(item));
		dispatch(setDetailModalOpen(true));
	};

	const filters: DynamicFilterField[] = [
		{
			key: 'action',
			placeholder: 'Filter by Action',
			type: 'select',
			value: activityParams.action,
			width: 170,
			options: [
				{ label: 'All Actions', value: '' },
				{ label: 'LOGIN', value: 'LOGIN' },
				{ label: 'LOGOUT', value: 'LOGOUT' },
				{ label: 'CREATE', value: 'CREATE' },
				{ label: 'UPDATE', value: 'UPDATE' },
				{ label: 'DELETE', value: 'DELETE' },
				{ label: 'CRAWL', value: 'CRAWL' },
				{ label: 'RETRY CRAWL', value: 'RETRY_CRAWL' },
				{ label: 'PERMISSION CHANGE', value: 'PERMISSION_CHANGE' },
				{ label: 'ROLE CHANGE', value: 'ROLE_CHANGE' },
			],
			onChange: (val) => dispatch(setActivityParams({ action: val || undefined, page: 1 })),
		},
		{
			key: 'module',
			placeholder: 'Filter by Module',
			type: 'select',
			value: activityParams.module,
			width: 170,
			options: [
				{ label: 'All Modules', value: '' },
				{ label: 'TIKTOK', value: 'TIKTOK' },
				{ label: 'USER MANAGEMENT', value: 'USER_MANAGEMENT' },
				{ label: 'ROLE', value: 'ROLE' },
				{ label: 'PERMISSION', value: 'PERMISSION' },
				{ label: 'SYSTEM', value: 'SYSTEM' },
				{ label: 'AUTH', value: 'AUTH' },
			],
			onChange: (val) => dispatch(setActivityParams({ module: val || undefined, page: 1 })),
		},
		{
			key: 'status',
			placeholder: 'Filter by Status',
			type: 'select',
			value: activityParams.status,
			width: 150,
			options: [
				{ label: 'All Statuses', value: '' },
				{ label: 'SUCCESS', value: 'SUCCESS' },
				{ label: 'FAILED', value: 'FAILED' },
				{ label: 'TIMEOUT', value: 'TIMEOUT' },
			],
			onChange: (val) => dispatch(setActivityParams({ status: val || undefined, page: 1 })),
		},
	];

	return (
		<div>
			<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
				<Col span={24} sm={12} lg={6}>
					<CardKPI
						title="Total Activities"
						value={activityStats?.total_activities ?? 0}
						icon={<UnorderedListOutlined />}
						color="#1677ff"
						subtext="All recorded audit entries"
					/>
				</Col>
				<Col span={24} sm={12} lg={6}>
					<CardKPI
						title="Successful Actions"
						value={activityStats?.success_activities ?? 0}
						icon={<CheckCircleOutlined />}
						color="#52c41a"
						subtext="Completed without failure"
					/>
				</Col>
				<Col span={24} sm={12} lg={6}>
					<CardKPI
						title="Failed Operations"
						value={activityStats?.failed_activities ?? 0}
						icon={<CloseCircleOutlined />}
						color="#ff4d4f"
						subtext="Errors and exceptions captured"
					/>
				</Col>
				<Col span={24} sm={12} lg={6}>
					<CardKPI
						title="Today Activities"
						value={activityStats?.today_activities ?? 0}
						icon={<FieldTimeOutlined />}
						color="#722ed1"
						subtext="Actions within current 24h"
					/>
				</Col>
			</Row>

			<ListLayout
				title="Activity Logs"
				subtitle="Immutable audit trail of system operations, user interactions, and background tasks"
				breadcrumbs={[
					{ title: 'Dashboard', href: '/admin/dashboard' },
					{ title: 'System', href: '/admin/system' },
					{ title: 'Activity Logs' },
				]}
				cardTitle="Audited Activity Trail"
				showSearch
				searchPlaceholder="Search by user email, record ID, or error message..."
				searchValue={activityParams.search}
				onSearch={handleSearch}
				filters={filters}
				onResetFilters={() => dispatch(resetActivityParams())}
				onRefresh={() => {
					dispatch(fetchActivityLogs(activityParams));
					dispatch(fetchActivityStatistics());
				}}
				refreshing={activityLoading}
			>
				<ActivityLogTable
					data={activityLogs}
					loading={activityLoading}
					pagination={activityPagination}
					onPageChange={(page, pageSize) => dispatch(setActivityParams({ page, per_page: pageSize }))}
					onViewDetail={handleViewDetail}
				/>
			</ListLayout>

			<ActivityLogDetailModal
				open={detailModalOpen}
				onClose={() => dispatch(setDetailModalOpen(false))}
				activity={selectedActivity}
			/>
		</div>
	);
}
