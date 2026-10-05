import { Form, Select, App as AntdApp } from "antd";
import React, { useEffect, useState } from "react";
import tiktokAccountApi from "@modules/TiktokAccount/assets/js/services/api";

const TiktokAccountSelect = ({ onChange }) => {
	const { message } = AntdApp.useApp();
	const [accounts, setAccounts] = useState([]);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchAccounts = async () => {
			setLoading(true);
			try {
				const response = await tiktokAccountApi.getAllAccountsWithoutPagination();
				setAccounts(response.data ?? []);
			} catch (error) {
				const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tiktok accounts';
				setError(errorMessage);
				message.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};
		fetchAccounts();
	}, [])

	return (
		<Form.Item
			preserve={false}
			name="account_ids"
			label="Tài khoản đã lưu"
			rules={[{ required: true, message: 'Vui lòng chọn ít nhất một tài khoản' }]}
		>
			<Select
				mode="multiple"
				disabled={accounts.length === 0}
				onChange={onChange}
				options={accounts.map(account => ({
					label: account.username,
					value: account.id,
				}))}
				loading={loading}
				placeholder={accounts.length ? "Chọn tài khoản" : "Không có tài khoản"}
				notFoundContent={error ? <span style={{ color: 'red' }}>{error}</span> : "Đang tải danh sách tài khoản..."}
			/>
		</Form.Item>
	)
}

export default React.memo(TiktokAccountSelect);