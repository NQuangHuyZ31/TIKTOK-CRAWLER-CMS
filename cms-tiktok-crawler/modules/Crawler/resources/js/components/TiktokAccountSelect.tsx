import { Form, Select, App as AntdApp } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '@core/store';
import { fetchAllTiktokAccounts } from '@modules/TiktokAccount/resources/js/store/tiktokAccount/tiktokAccountThunks';

const TiktokAccountSelect = ({ onChange }) => {
	const dispatch = useDispatch();
	const { data: accounts, loading, error } = useSelector((state) => state.tiktokAccount);

	useEffect(() => {
		dispatch(fetchAllTiktokAccounts({ pagination: false }));
	}, [dispatch]);

	return (
		<Form.Item preserve={false} name="account_ids" label="Saved Accounts" rules={[{ required: true, message: 'Please select at least one account' }]}>
			<Select
				mode="multiple"
				disabled={accounts.length === 0}
				onChange={onChange}
				options={accounts.map((account) => ({
					label: account.username,
					value: account.id,
				}))}
				loading={loading}
				placeholder={accounts.length ? 'Select accounts' : 'No accounts available'}
				notFoundContent={error ? <span style={{ color: 'red' }}>{error}</span> : 'Loading accounts...'}
			/>
		</Form.Item>
	);
};

export default React.memo(TiktokAccountSelect);
