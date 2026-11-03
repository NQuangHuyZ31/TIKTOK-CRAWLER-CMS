import React, { useEffect } from 'react';
import { Avatar, Button, Flex, Form, Select, Space, Tag, Typography } from 'antd';
import { CheckOutlined, ClearOutlined, UserOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import { fetchAllTiktokAccounts } from '@modules/TiktokAccount/resources/js/store/tiktokAccount/tiktokAccountThunks';
import { formatCompactNumber } from '@core/utils/formatNumber';

const { Text } = Typography;

interface TiktokAccountSelectProps {
	onChange?: (value: number[]) => void;
	disabled?: boolean;
}

const TiktokAccountSelect: React.FC<TiktokAccountSelectProps> = ({ onChange, disabled = false }) => {
	const dispatch = useDispatch();
	const form = Form.useFormInstance();
	const { data: accounts, loading, error } = useSelector((state) => state.tiktokAccount);
	const selectedIds = Form.useWatch('account_ids', form) || [];

	useEffect(() => {
		dispatch(fetchAllTiktokAccounts({ pagination: false }));
	}, [dispatch]);

	const handleSelectTop = (count: number) => {
		if (!accounts || accounts.length === 0) return;
		const topIds = accounts.slice(0, count).map((acc: any) => acc.id);
		form.setFieldsValue({ account_ids: topIds });
		onChange?.(topIds);
	};

	const handleSelectAll = () => {
		if (!accounts || accounts.length === 0) return;
		const allIds = accounts.map((acc: any) => acc.id);
		form.setFieldsValue({ account_ids: allIds });
		onChange?.(allIds);
	};

	const handleClear = () => {
		form.setFieldsValue({ account_ids: [] });
		onChange?.([]);
	};

	return (
		<div style={{ marginBottom: 16 }}>
			<Flex justify="space-between" align="center" style={{ marginBottom: 8 }} wrap="wrap" gap={8}>
				<Space orientation="horizontal" size={8}>
					<Text strong>Select Saved Accounts</Text>
					<Tag color={selectedIds.length > 0 ? 'blue' : 'default'}>
						Selected: {selectedIds.length} / {accounts?.length || 0}
					</Tag>
				</Space>

				{!disabled && accounts?.length > 0 && (
					<Space orientation="horizontal" size={6} wrap>
						{accounts.length > 10 && (
							<Button size="small" type="dashed" onClick={() => handleSelectTop(10)}>
								Select Top 10
							</Button>
						)}
						<Button size="small" type="dashed" icon={<CheckOutlined />} onClick={handleSelectAll}>
							Select All
						</Button>
						{selectedIds.length > 0 && (
							<Button size="small" danger type="text" icon={<ClearOutlined />} onClick={handleClear}>
								Clear
							</Button>
						)}
					</Space>
				)}
			</Flex>

			<Form.Item
				preserve={false}
				name="account_ids"
				rules={[{ required: true, message: 'Please select at least one account from the list' }]}
				style={{ marginBottom: 0 }}
			>
				<Select
					mode="multiple"
					disabled={disabled || !accounts || accounts.length === 0}
					onChange={onChange}
					loading={loading}
					placeholder={
						accounts?.length
							? 'Search and select accounts by nickname or username...'
							: 'No accounts found in system'
					}
					filterOption={(input, option) => {
						const search = input.toLowerCase();
						const labelStr = String(option?.label ?? '').toLowerCase();
						const valStr = String(option?.value ?? '').toLowerCase();
						return labelStr.includes(search) || valStr.includes(search);
					}}
					options={(accounts || []).map((account: any) => ({
						value: account.id,
						label: `${account.nickname || account.username} (@${account.username})`,
						itemData: account,
					}))}
					optionRender={(option) => {
						const acc = (option.data as any)?.itemData;
						if (!acc) return option.label;
						return (
							<Flex justify="space-between" align="center" style={{ padding: '2px 0' }}>
								<Space size={8}>
									<Avatar
										size={24}
										src={acc.avatar_path || undefined}
										icon={!acc.avatar_path ? <UserOutlined /> : undefined}
									/>
									<div>
										<Text strong style={{ fontSize: 13 }}>
											{acc.nickname || acc.username}
										</Text>
										<Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
											@{acc.username}
										</Text>
									</div>
								</Space>
								{acc.followers_count !== undefined && (
									<Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>
										{formatCompactNumber(acc.followers_count)} flws
									</Tag>
								)}
							</Flex>
						);
					}}
					notFoundContent={
						error ? <span style={{ color: 'red' }}>{error}</span> : 'No matching accounts found'
					}
				/>
			</Form.Item>
		</div>
	);
};

export default React.memo(TiktokAccountSelect);
