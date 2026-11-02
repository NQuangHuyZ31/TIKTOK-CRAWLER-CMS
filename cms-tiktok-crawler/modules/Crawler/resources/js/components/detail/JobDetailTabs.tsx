import React from 'react';
import { Radio } from 'antd';
import { UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { formatNumber } from '@core/utils/formatNumber';

interface JobDetailTabsProps {
	activeTab: 'accounts' | 'videos';
	onChange: (tab: 'accounts' | 'videos') => void;
	totalAccounts: number;
	totalVideos: number;
}

export default function JobDetailTabs({
	activeTab,
	onChange,
	totalAccounts,
	totalVideos,
}: JobDetailTabsProps) {
	return (
		<Radio.Group
			value={activeTab}
			onChange={(e) => onChange(e.target.value)}
			optionType="button"
			buttonStyle="solid"
		>
			<Radio.Button value="accounts">
				<UserOutlined /> Accounts ({formatNumber(totalAccounts)})
			</Radio.Button>
			<Radio.Button value="videos">
				<VideoCameraOutlined /> Videos ({formatNumber(totalVideos)})
			</Radio.Button>
		</Radio.Group>
	);
}
