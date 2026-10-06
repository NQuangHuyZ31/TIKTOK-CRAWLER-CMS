import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Space } from "antd";
import { fechAllTiktokAccounts } from "@modules/TiktokAccount/assets/js/store/tiktokAccount/tiktokAccountThunks";
import { setParams } from "@modules/TiktokAccount/assets/js/store/tiktokAccount/tiktokAccountSlice";
import columnConfig from "@modules/TiktokAccount/assets/js/configs/columnConfig";
import AccountColumn from "@modules/TiktokAccount/assets/js/components/AccountColumn";
import StatusTag from "@modules/Core/assets/js/components/StatusTag";
import TableComponent from "@modules/Core/assets/js/components/Table";
import SearchColumnTable from "@modules/Core/assets/js/components/SearchColumnTable";
import { Link } from "react-router-dom";

const TiktokAccountTableList = () => {
	const dispatch = useDispatch();
	const { data: acccounts, loading, error, pagination, params } = useSelector((state) => state.tiktokAccount);

	useEffect(() => {
		dispatch(fechAllTiktokAccounts(params));
	}, [dispatch, params]);

	const columns = useMemo(() => {
		return columnConfig.map((column) => {
			const tableColumn = column.search_type === 'search'
				? SearchColumnTable(column, column.search_rule?.type, setParams, 'tiktokAccount')
				: column;

			if (column.component === 'account') {
				return {
					...tableColumn,
					render: (username, record) => <AccountColumn username={username} imgPath={record.avatar_url} />
				}
			}

			if (column.component === 'status') {
				return {
					...tableColumn,
					sorter: (a, b) => {
						const statusOrder = {
							active: 1,
							inactive: 2,
						};

						return (
							(statusOrder[a.status?.toLowerCase()] ?? 99)
							- (statusOrder[b.status?.toLowerCase()] ?? 99)
						);
					},
					render: (status) => <StatusTag status={status} />,
				}
			}

			if (column.search_type === 'sort') {
				return {
					...tableColumn,
					sorter: (a, b) => (a[column.dataIndex] ?? 0) - (b[column.dataIndex] ?? 0),
				};
			}

			if (column.component === 'action') {
				return {
					...tableColumn,
					render: (_, record) => (
						<Space>
							<Link to={`/tiktok-accounts/${record.id}`}>Detail</Link>
							<Link to={`/tiktok-accounts/${record.id}/edit`}>Edit</Link>
						</Space>
					)
				};
			}

			return tableColumn;
		})
	}, []);

	const handlePageChange = (page, pageSize) => {
		dispatch((setParams({ page, per_page: pageSize })));
	}

	return (
		<>
			{
				error ? (
					<Alert type="error" title={error} showIcon />
				) : (
					<TableComponent
						columns={columns}
						data={acccounts}
						pagination={pagination}
						handlePageChange={handlePageChange}
						loading={loading}
					/>
				)
			}
		</>
	)
}



export default React.memo(TiktokAccountTableList)