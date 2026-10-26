import React from 'react';
import { Radio, Space, Typography, Tag, Card } from 'antd';
import { CrownOutlined, SafetyCertificateOutlined, ToolOutlined, EyeOutlined } from '@ant-design/icons';
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

	const rolesList =
		availableRoles.length > 0
			? availableRoles
			: [
					{ id: 1, name: 'Super Administrator', slug: 'admin', description: ROLE_CONFIGS.admin.description },
					{ id: 2, name: 'Operations Manager', slug: 'manager', description: ROLE_CONFIGS.manager.description },
					{ id: 3, name: 'Crawler Specialist', slug: 'editor', description: ROLE_CONFIGS.editor.description },
					{ id: 4, name: 'Data Viewer', slug: 'viewer', description: ROLE_CONFIGS.viewer.description },
				];

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
								border: isSelected ? `2px solid ${cfg.color}` : '1px solid #d9d9d9',
								background: isSelected ? cfg.bg : '#ffffff',
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
											{r.description || cfg.description}
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
