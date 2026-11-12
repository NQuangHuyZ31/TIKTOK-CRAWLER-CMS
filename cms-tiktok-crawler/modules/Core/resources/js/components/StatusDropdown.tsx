import React, { useState } from 'react';
import { Dropdown, MenuProps } from 'antd';
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	DownOutlined,
	LoadingOutlined,
	StopOutlined,
	ClockCircleOutlined,
} from '@ant-design/icons';
import StatusTag, { StatusType } from './StatusTag';
import usePermission, { PermissionAction } from '../hooks/usePermission';

export interface StatusDropdownOption {
	value: string;
	label?: React.ReactNode;
	icon?: React.ReactNode;
	danger?: boolean;
	disabled?: boolean;
}

export interface StatusDropdownProps {
	/** Current status value */
	status?: StatusType | null;
	/** Available status options to switch to */
	options?: StatusDropdownOption[];
	/** Callback invoked when a new status is selected */
	onChange?: (newStatus: string) => Promise<any> | void;
	/** Loading state override */
	loading?: boolean;
	/** Disabled state override */
	disabled?: boolean;
	/** Target module slug for permission check (e.g. 'user', 'tiktok_account') */
	module?: string;
	/** Action required for permission check (defaults to 'edit') */
	action?: PermissionAction;
	/** Show dropdown arrow icon next to tag */
	showArrow?: boolean;
	/** Custom style for the wrapper */
	style?: React.CSSProperties;
}

const defaultStatusIcons: Record<string, React.ReactNode> = {
	active: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
	inactive: <StopOutlined style={{ color: '#faad14' }} />,
	blocked: <StopOutlined style={{ color: '#ff4d4f' }} />,
	banned: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
	pending: <ClockCircleOutlined style={{ color: '#faad14' }} />,
};

const defaultStatusLabels: Record<string, string> = {
	active: 'Set as Active',
	inactive: 'Set as Inactive',
	blocked: 'Block Account',
	banned: 'Ban Account',
	pending: 'Set as Pending',
};

/**
 * Universal Status Dropdown component for switching resource statuses
 * directly from list tables with automatic permission check and loading state.
 */
export default function StatusDropdown({
	status,
	options,
	onChange,
	loading: externalLoading,
	disabled = false,
	module,
	action = 'edit',
	showArrow = true,
	style,
}: StatusDropdownProps) {
	const { can } = usePermission();
	const [internalLoading, setInternalLoading] = useState(false);

	const currentStatus = String(status || '').toLowerCase();
	const isLoading = Boolean(externalLoading || internalLoading);

	// Permission gate check: if module is specified, check permission
	const isAllowed = !disabled && (!module || can({ module, action }));

	// If user does not have permission or component is disabled, render plain StatusTag
	if (!isAllowed) {
		return <StatusTag status={status} style={style} />;
	}

	const resolvedOptions: StatusDropdownOption[] =
		options && options.length > 0
			? options
			: [
					{ value: 'active' },
					{ value: 'inactive' },
			  ];

	const handleMenuClick = async (newStatus: string) => {
		if (newStatus === currentStatus || isLoading) {
			return;
		}

		if (onChange) {
			try {
				setInternalLoading(true);
				await onChange(newStatus);
			} finally {
				setInternalLoading(false);
			}
		}
	};

	const menuItems: MenuProps['items'] = resolvedOptions.map((opt) => {
		const val = opt.value.toLowerCase();
		const isCurrent = val === currentStatus;
		const icon = opt.icon ?? defaultStatusIcons[val];
		const label = opt.label ?? defaultStatusLabels[val] ?? opt.value;
		const isDanger = opt.danger ?? (val === 'blocked' || val === 'banned');

		return {
			key: opt.value,
			label,
			icon,
			danger: isDanger,
			disabled: isCurrent || opt.disabled || isLoading,
			onClick: () => handleMenuClick(opt.value),
		};
	});

	return (
		<Dropdown menu={{ items: menuItems }} trigger={['click']} disabled={isLoading}>
			<span
				style={{
					cursor: isLoading ? 'wait' : 'pointer',
					display: 'inline-flex',
					alignItems: 'center',
					userSelect: 'none',
					...style,
				}}
			>
				<StatusTag status={status} />
				{isLoading ? (
					<LoadingOutlined style={{ fontSize: 11, marginLeft: 4, color: '#EC008C' }} />
				) : showArrow ? (
					<DownOutlined style={{ fontSize: 9, marginLeft: 4, color: '#8c8c8c' }} />
				) : null}
			</span>
		</Dropdown>
	);
}
