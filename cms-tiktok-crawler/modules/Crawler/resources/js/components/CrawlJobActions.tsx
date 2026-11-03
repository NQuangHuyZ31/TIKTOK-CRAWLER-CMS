import React from 'react';
import { Button, Popconfirm, Space, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlayCircleOutlined, RedoOutlined, StopOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import PermissionGate from '@core/components/PermissionGate';

interface CrawlJobActionsProps {
	record: any;
	onStart: (id: number | string) => void;
	onStop: (id: number | string) => void;
	onRetry: (id: number | string) => void;
	onDelete: (id: number | string) => void;
}

export default function CrawlJobActions({
	record,
	onStart,
	onStop,
	onRetry,
	onDelete,
}: CrawlJobActionsProps) {
	return (
		<Space size={4}>
			<PermissionGate module="crawler" action="view">
				<Tooltip title="Detail">
					<Link to={`/crawler/crawl-job/${record.id}`}>
						<Button size="small" type="text" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
					</Link>
				</Tooltip>
			</PermissionGate>
			<PermissionGate module="crawler" action="edit">
				{record.status === 'pending' && (
					<>
						<Tooltip title="Edit">
							<Link to={`/crawler/crawl-job/${record.id}/edit`}>
								<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} />
							</Link>
						</Tooltip>
						<Popconfirm
							title="Start crawl job"
							description="Are you sure you want to start this crawl job?"
							onConfirm={() => onStart(record.id)}
							okText="Start"
							cancelText="Cancel"
						>
							<Tooltip title="Start">
								<Button size="small" type="text" icon={<PlayCircleOutlined style={{ color: '#1677ff' }} />} />
							</Tooltip>
						</Popconfirm>
					</>
				)}
				{(record.status === 'running' || record.status === 'queued') && (
					<Popconfirm
						title="Stop crawl job"
						description="Are you sure you want to stop this crawl job?"
						onConfirm={() => onStop(record.id)}
						okText="Stop"
						cancelText="Cancel"
						okButtonProps={{ danger: true }}
					>
						<Tooltip title="Stop">
							<Button size="small" type="text" danger icon={<StopOutlined />} />
						</Tooltip>
					</Popconfirm>
				)}
				{record.status === 'failed' && (
					<Popconfirm
						title="Retry crawl job"
						description="Are you sure you want to retry this failed crawl job?"
						onConfirm={() => onRetry(record.id)}
						okText="Retry"
						cancelText="Cancel"
					>
						<Tooltip title="Retry">
							<Button size="small" type="text" icon={<RedoOutlined style={{ color: '#fa8c16' }} />} />
						</Tooltip>
					</Popconfirm>
				)}
			</PermissionGate>
			{record.status !== 'running' && (
				<PermissionGate module="crawler" action="delete">
					<Popconfirm
						title="Delete crawl job"
						description="Are you sure you want to delete this crawl job?"
						onConfirm={() => onDelete(record.id)}
						okText="Delete"
						cancelText="Cancel"
						okButtonProps={{ danger: true }}
					>
						<Tooltip title="Delete">
							<Button type="text" danger size="small" icon={<DeleteOutlined />} />
						</Tooltip>
					</Popconfirm>
				</PermissionGate>
			)}
		</Space>
	);
}
