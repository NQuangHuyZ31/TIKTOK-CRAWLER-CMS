import { CrownOutlined, SafetyCertificateOutlined, KeyOutlined } from '@ant-design/icons';
import { Space, Tag } from 'antd';
import { ROLE_CONFIGS } from '../configs/userConstants';

export const UserRoleTags = ({ roles, permissionType }: { roles?: any[]; permissionType?: 'role' | 'user' }) => {
	if (permissionType === 'user') {
		return (
			<Tag
				color="purple"
				icon={<KeyOutlined />}
				style={{
					fontWeight: 600,
					fontSize: 11,
					padding: '2px 8px',
					borderRadius: 4,
				}}
			>
				Direct Permissions
			</Tag>
		);
	}

	if (!roles || roles.length === 0) {
		return <Tag color="default">No Role</Tag>;
	}

	return (
		<Space size={4} wrap>
			{roles.map((r) => {
				const slug = typeof r === 'string' ? r : r.slug;
				const cfg = ROLE_CONFIGS[slug] || ROLE_CONFIGS.viewer;
				const icon = slug === 'admin' ? <CrownOutlined /> : <SafetyCertificateOutlined />;

				return (
					<Tag
						key={slug}
						icon={icon}
						style={{
							color: cfg.color,
							background: cfg.bg,
							borderColor: cfg.border,
							fontWeight: 600,
							fontSize: 11,
							padding: '2px 8px',
							borderRadius: 4,
						}}
					>
						{cfg.name}
					</Tag>
				);
			})}
		</Space>
	);
};
