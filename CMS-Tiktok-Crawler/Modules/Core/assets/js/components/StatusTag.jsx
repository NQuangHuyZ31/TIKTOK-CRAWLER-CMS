import { Tag } from 'antd';

const statusConfig = {
	pending: { color: 'default' },
	in_progress: { color: 'processing' },
	running: { color: 'processing' },
	completed: { color: 'success' },
	success: { color: 'success' },
	failed: { color: 'error' },
	inactive: { color: 'default' },
	active: { color: 'success' },
};

export default function StatusTag({ status }) {
	const value = String(status || 'pending');
	const config = statusConfig[value] || { color: 'default' };

	return <Tag color={config.color}>{value.replace('_', ' ')}</Tag>;
}
