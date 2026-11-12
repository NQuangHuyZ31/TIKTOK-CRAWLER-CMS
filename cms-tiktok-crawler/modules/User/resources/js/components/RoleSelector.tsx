import { Radio, Space, Typography, Tag, Card, theme } from 'antd';
import { CrownOutlined, SafetyCertificateOutlined, ToolOutlined, EyeOutlined } from '@ant-design/icons';
import { useTheme } from '@core/contexts/ThemeContext';
import { ROLE_CONFIGS } from '../configs/userConstants';
import type { UserRole } from '../Action/user';

const { Text } = Typography;

interface RoleSelectorProps {
	value?: string | string[];
	onChange?: (val: string[]) => void;
	availableRoles?: UserRole[];
	disabled?: boolean;
}

export default function RoleSelector({ value, onChange, availableRoles = [], disabled = false }: RoleSelectorProps) {
	const { token } = theme.useToken();
	const { isDark } = useTheme();
	const selectedSlug = Array.isArray(value) ? value[0] || 'editor' : value || 'editor';

	const getRoleIcon = (slug: string) => {
		switch (slug) {
			case 'admin':
				return <CrownOutlined style={{ color: '#722ed1', fontSize: 18 }} />;
			case 'manager':
				return <SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 18 }} />;
			case 'editor':
				return <ToolOutlined style={{ color: '#13c2c2', fontSize: 18 }} />;
			default:
				return <EyeOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />;
		}
	};

	const rolesList = availableRoles.length > 0 ? availableRoles : [];

	return (
		<Radio.Group value={selectedSlug} onChange={(e) => onChange?.([e.target.value])} disabled={disabled} style={{ width: '100%' }}>
			<Space direction="vertical" style={{ width: '100%' }} size={10}>
				{rolesList.map((r) => {
					const cfg = ROLE_CONFIGS[r.slug] || ROLE_CONFIGS.viewer;
					const isSelected = selectedSlug === r.slug;

					return (
						<Card
							key={r.slug}
							size="small"
							hoverable={!disabled}
							onClick={() => !disabled && onChange?.([r.slug])}
							style={{
								cursor: disabled ? 'not-allowed' : 'pointer',
								borderRadius: 8,
								border: isSelected ? `2px solid ${cfg.color}` : `1px solid ${token.colorBorder}`,
								background: isSelected ? (isDark ? `${cfg.color}18` : cfg.bg) : token.colorBgContainer,
								transition: 'all 0.2s',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
								<Radio value={r.slug} style={{ marginTop: 2 }} />
								<div style={{ flex: 1 }}>
									<Space size={8} align="center">
										{getRoleIcon(r.slug)}
										<Text strong style={{ fontSize: 14 }}>
											{r.name}
										</Text>
										<Tag
											color={cfg.color}
											style={{
												margin: 0,
												fontSize: 11,
												fontWeight: 600,
												borderRadius: 4,
											}}
										>
											{r.slug.toUpperCase()}
										</Tag>
									</Space>
									<div style={{ marginTop: 4 }}>
										<Text type="secondary" style={{ fontSize: 12 }}>
											{r.description ?? ''}
										</Text>
									</div>
								</div>
							</div>
						</Card>
					);
				})}
			</Space>
		</Radio.Group>
	);
}
