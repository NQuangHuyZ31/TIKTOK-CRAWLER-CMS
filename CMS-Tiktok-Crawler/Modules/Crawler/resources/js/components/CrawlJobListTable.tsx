import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';
import { Space, Alert, Button, Popconfirm, App as AntdApp } from 'antd';
import { fetchCrawlJobs, fetchStatisticsSummary } from '../store/crawlJob/crawlJobThunks';
import { setParams } from '../store/crawlJob/crawlJobSlice';
import crawlJobAPI from '../Action/crawlJob';
import TableComponent from '@core/components/Table';
import StatusTag from '@core/components/StatusTag';
import { crawlJobColumnConfig } from '../configs/tableConfig';

export default function CrawlJobListTable() {
	const { message } = AntdApp.useApp();
	const dispatch = useDispatch();
	const { data: jobs, loading, error, pagination, params } = useSelector((state) => state.crawlJob);

	// Fetch crawl jobs from API
	useEffect(() => {
		dispatch(fetchCrawlJobs(params));
	}, [dispatch, params]);

	// Handle page change for pagination
	const handlePageChange = (page: number, per_page: number) => {
		dispatch(setParams({ page, per_page }));
	};

	// Xóa trực tiếp qua API, không cần component trung gian
	const handleDelete = async (id: number | string) => {
		try {
			const res = await crawlJobAPI.deleteCrawlJobByID(id);
			message.success(res?.message || 'Xóa crawl job thành công');
			dispatch(fetchCrawlJobs(params));
			dispatch(fetchStatisticsSummary());
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Xóa crawl job thất bại');
		}
	};

	return (
		<>
			{error ? (
				<Alert type="error" title={error} showIcon />
			) : (
				<TableComponent
					columns={crawlJobColumnConfig}
					data={jobs}
					pagination={pagination}
					handlePageChange={handlePageChange}
					loading={loading}
					renderColumns={{
						status: (status) => <StatusTag status={status} />,
						action: (_, record) => (
							<Space>
								<Link to={`/crawler/crawl-job/${record.id}`}>Detail</Link>
								{record.status === 'pending' && (
									<Link to={`/crawler/crawl-job/${record.id}/edit`}>Edit</Link>
								)}
								<Popconfirm
									title="Xóa crawl job"
									description="Bạn có chắc chắn muốn xóa crawl job này?"
									onConfirm={() => handleDelete(record.id)}
									okText="Xóa"
									cancelText="Hủy"
									okButtonProps={{ danger: true }}
								>
									<Button type="link" danger size="small" style={{ padding: 0 }}>
										Delete
									</Button>
								</Popconfirm>
							</Space>
						),
					}}
				/>
			)}
		</>
	);
}