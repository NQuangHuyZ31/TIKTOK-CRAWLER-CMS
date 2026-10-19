import type { MenuProps } from 'antd';
import {
	Avatar,
	Badge,
	Button,
	Dropdown,
	Flex,
	Layout,
	Space,
	Tag,
	Typography,
} from 'antd';
import {
	BellOutlined,
	DownOutlined,
	LogoutOutlined,
	SettingOutlined,
	UserOutlined,
} from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Text, Title } = Typography;

const accountMenuItems: MenuProps['items'] = [
	{ key: 'profile', icon: <UserOutlined />, label: 'Profile' },
	{ key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
	{ type: 'divider' },
	{ key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true },
];

export default function Header() {
	return (
		<AntHeader
			style={{
				background: '#ffffff',
				padding: '0 28px',
				height: 76,
				flexShrink: 0,
				lineHeight: 'normal',
				borderBottom: '1px solid #edf0f5',
			}}
		>
			<Flex align="center" justify="flex-end" className="h-full w-full">
				<Space size={18}>
					<Tag
						color="success"
						icon={<span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#52c41a' }} />}
						style={{ margin: 0, padding: '5px 10px', border: 0, borderRadius: 6, background: '#f0f9ed', color: '#3f7d2a' }}
					>
						Crawler online
					</Tag>
					<Badge count={3} size="small" offset={[-2, 3]}>
						<Button
							type="text"
							shape="circle"
							icon={<BellOutlined style={{ fontSize: 18, color: '#667085' }} />}
							aria-label="Notifications"
						/>
					</Badge>
					<Dropdown menu={{ items: accountMenuItems }} trigger={['click']} placement="bottomRight">
						<Button type="text" style={{ height: 44, padding: '4px 6px 4px 4px' }}>
							<Space size={9}>
								<Avatar size={34} style={{ background: '#e6f4ff', color: '#1677ff', fontWeight: 600 }}>AD</Avatar>
								<span style={{ textAlign: 'left', lineHeight: 1.2 }}>
									<Text strong style={{ display: 'block', color: '#172033', fontSize: 13 }}>Admin</Text>
									<Text type="secondary" style={{ display: 'block', fontSize: 11 }}>Administrator</Text>
								</span>
								<DownOutlined style={{ fontSize: 10, color: '#98a2b3' }} />
							</Space>
						</Button>
					</Dropdown>
				</Space>
			</Flex>
		</AntHeader>
	);
}