import { Alert, Card, Typography } from 'antd';

const { Title, Text } = Typography;

export default function TiktokAccountsPage() {
	return (
		<div>
			<Title level={2}>Tài khoản TikTok</Title>
			<Text type="secondary">Màn hình quản lý tài khoản sẽ có thể thao tác khi API account được triển khai.</Text>
			<Card style={{ marginTop: 20 }}>
				<Alert
					type="info"
					showIcon
					title="Chưa có API account đang hoạt động"
					description="Controller, repository và route account hiện đang rỗng; giao diện đã sẵn sàng để nối khi backend hoàn thiện."
				/>
			</Card>
		</div>
	);
}
