import React from 'react';
import { Alert, Button, Popconfirm, Space } from 'antd';
import { DeleteOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PermissionGate from '@core/components/PermissionGate';

interface JobDetailHeaderProps {
	job: any;
	stopping: boolean;
	deleting: boolean;
	onStop: () => void;
	onDelete: () => void;
}

export default function JobDetailHeader({
	job,
	stopping,
	deleting,
	onStop,
	onDelete,
}: JobDetailHeaderProps) {
	const navigate = useNavigate();

	const isWaitingForServiceRestart =
		(job?.status === 'running' || job?.status === 'queued') &&
		String(job?.error_message || '').includes('waiting for service');

	return (
		<>
			{isWaitingForServiceRestart && (
				<Alert
					type="warning"
					showIcon
					message="Crawler service has shut down — waiting for service restart to resume (Crash Recovery)"
					description={job?.error_message}
					style={{ marginBottom: 16 }}
				/>
			)}
			<Space>
				{job?.status === 'pending' && (
					<PermissionGate module="crawler" action="edit">
						<Button icon={<EditOutlined />} onClick={() => navigate(`/crawler/crawl-job/${job.id}/edit`)}>
							Edit
						</Button>
					</PermissionGate>
				)}
				{(job?.status === 'running' || job?.status === 'queued') && (
					<PermissionGate module="crawler" action="edit">
						<Popconfirm
							title="Stop crawl job"
							description="Are you sure you want to stop this crawl job?"
							onConfirm={onStop}
							okText="Stop"
							cancelText="Cancel"
							okButtonProps={{ danger: true, loading: stopping }}
						>
							<Button danger icon={<StopOutlined />} loading={stopping}>
								Stop Job
							</Button>
						</Popconfirm>
					</PermissionGate>
				)}
				{job?.status !== 'running' && (
					<PermissionGate module="crawler" action="delete">
						<Popconfirm
							title="Delete crawl job"
							description="Are you sure you want to delete this crawl job?"
							onConfirm={onDelete}
							okText="Delete"
							cancelText="Cancel"
							okButtonProps={{ danger: true, loading: deleting }}
						>
							<Button danger icon={<DeleteOutlined />} loading={deleting}>
								Delete
							</Button>
						</Popconfirm>
					</PermissionGate>
				)}
			</Space>
		</>
	);
}
