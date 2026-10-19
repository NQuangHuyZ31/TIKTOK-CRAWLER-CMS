import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, App as AntdApp } from 'antd';
import { useDispatch, useSelector } from '../../../../Core/resources/js/store';
import { deleteCrawlJobById, fetchStatisticsSummary } from '../store/crawlJob/crawlJobThunks';
import CustomModal from '../../../../Core/resources/js/components/CustomModal';


interface DeleteCrawlJobButtonProps {
	jobID: string | number;
	onDeleted?: () => void;
	redirectOnDelete?: boolean;
	textOnly?: boolean;
}

export default function DeleteCrawlJobButton({ jobID, onDeleted, redirectOnDelete = true, textOnly = false }: DeleteCrawlJobButtonProps) {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { message } = AntdApp.useApp();
	const { loadingDeleted, error } = useSelector((state) => state.crawlJob);
	const [openModal, setOpenModal] = useState(false);

	const handleDelete = async () => {
		try {
			const result = await dispatch(deleteCrawlJobById(jobID)).unwrap();
			message.success(result?.message || 'Delete completed');
			setOpenModal(false);
			if (onDeleted) {
				onDeleted();
			} else if (redirectOnDelete) {
				navigate('/crawler/crawl-job');
			}
		} catch (error) {
			message.error(error?.message || error || 'Delete failed');
		}
	}

	return (
		<>
			<Button
				type={textOnly ? 'link' : undefined}
				danger={textOnly}
				color={textOnly ? undefined : 'danger'}
				variant={textOnly ? undefined : 'solid'}
				onClick={() => setOpenModal(true)}
			>
				Delete
			</Button>
			{openModal && <CustomModal
				title="Delete Crawl Job"
				open={openModal}
				handleOk={handleDelete}
				confirmLoading={loadingDeleted}
				onClose={() => setOpenModal(false)}
			>
				<p>Are you sure you want to delete this crawl job?</p>
			</CustomModal>
			}
		</>
	)
}