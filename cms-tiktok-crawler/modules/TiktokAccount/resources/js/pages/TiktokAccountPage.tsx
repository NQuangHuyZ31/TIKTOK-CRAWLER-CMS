import { Card } from 'antd';
import PageHeader from '@core/components/PageHeader';
import TiktokAccountTableList from '../components/TiktokAccountTableList';

export default function TiktokAccountPage() {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader
				title="TikTok Accounts"
				subtitle="Manage and monitor accounts collected from TikTok."
			/>

			<Card title="Account list">
				<TiktokAccountTableList />
			</Card>
		</div>
	);
}
