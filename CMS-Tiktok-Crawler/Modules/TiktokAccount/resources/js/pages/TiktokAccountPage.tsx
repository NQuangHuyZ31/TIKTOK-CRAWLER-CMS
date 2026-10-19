import { useEffect, useMemo } from 'react';
import {
	Button,
	Card,
	Space,
	Typography,
} from 'antd';
import {
	PlusOutlined,
} from '@ant-design/icons';
import StatisticSummary from '@modules/TiktokAccount/resources/js/components/StatisticSummary';
import TiktokAccountTableList from '@modules/TiktokAccount/resources/js/components/TiktokAccountTableList';

const { Text, Title } = Typography;

export default function TiktokAccountPage() {

	return (
		<Space orientation="vertical" size={24} style={{ width: '100%' }}>
			<Space orientation="vertical" size={4}>
				<Title level={3} style={{ margin: 0 }}>TikTok Accounts</Title>
				<Text type="secondary">Manage and monitor accounts collected from TikTok.</Text>
			</Space>

			<StatisticSummary />

			<Card
				title="Account list"
				extra={
					<Space wrap>
						{/* <Button icon={<ReloadOutlined />}>Refresh</Button> */}
						<Button type="primary" icon={<PlusOutlined />}>Add account</Button>
					</Space>
				}
			>
				<TiktokAccountTableList />
			</Card>
		</Space>
	);
}
