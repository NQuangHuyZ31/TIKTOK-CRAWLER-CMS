import { Form, Select, App as AntdApp } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from '@core/store';
import { fechAllTiktokAccounts } from "@modules/TiktokAccount/resources/js/store/tiktokAccount/tiktokAccountThunks";

const TiktokAccountSelect = ({ onChange }) => {
	const dispatch = useDispatch();
	const { data: accounts, loading, error } = useSelector(state => state.tiktokAccount)

	useEffect(() => {
		dispatch(fechAllTiktokAccounts({ pagination: false }))
	}, [dispatch]);

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