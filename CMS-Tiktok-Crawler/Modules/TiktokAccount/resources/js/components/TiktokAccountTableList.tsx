import React, { useEffect } from "react";
import { useDispatch, useSelector } from '@core/store';
import { Alert, Space } from "antd";
import { fechAllTiktokAccounts } from "../store/tiktokAccount/tiktokAccountThunks";
import { setParams } from "../store/tiktokAccount/tiktokAccountSlice";
import columnConfig from "../configs/columnConfig";
import AccountColumn from "./AccountColumn";
import TableComponent from "@core/components/Table";
import StatusTag from "@core/components/StatusTag";
import { Link } from "react-router-dom";
import DeleteAccount from './DeleteAccount';

const TiktokAccountTableList = () => {
	const dispatch = useDispatch();
	const { data: accounts, loading, error, pagination, params } = useSelector((state) => state.tiktokAccount);

	useEffect(() => {
		dispatch(fechAllTiktokAccounts(params));
	}, [dispatch, params]);

	const handlePageChange = (page: number, pageSize: number) => {
		dispatch(setParams({ page, per_page: pageSize }));
	};

	return (
		<>
			{error ? (
				<Alert type="error" title={error} showIcon />
			) : (
				<TableComponent
					columns={columnConfig}
					data={accounts}
					pagination={pagination}
					handlePageChange={handlePageChange}
					loading={loading}
					renderColumns={{
						username: (username, record) => (
							<AccountColumn username={username} imgPath={record.avatar_path} />
						),
						status: (status) => <StatusTag status={status} />,
						action: (_, record) => (
							<Space>
								<Link to={`/tiktok-account/${record.id}`}>Detail</Link>
								<Link to={`/tiktok-account/${record.id}/edit`}>Edit</Link>
								<DeleteAccount accountId={record.id} textOnly redirectOnDelete={false} />
							</Space>
						),
					}}
				/>
			)}
		</>
	);
};

export default React.memo(TiktokAccountTableList);