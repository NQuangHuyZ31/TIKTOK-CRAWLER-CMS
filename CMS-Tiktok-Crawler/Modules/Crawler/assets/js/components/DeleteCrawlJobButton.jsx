import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, App as AntdApp } from 'antd';
import CustomModal from '@modules/Core/assets/js/components/CustomModal';
import crawlJobApi from '@modules/Crawler/assets/js/services/api';

export default function DeleteCrawlJobButton({ jobID }) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const { message } = AntdApp.useApp();

	const handleOk = async () => {
		setConfirmLoading(true);

		try {
			const res = await crawlJobApi.deleteCrawlJobByID(jobID);
			message.success('Crawl job deleted successfully');
			setOpen(false);

			// navigate to the crawl jobs list page after deletion
			navigate('/crawl-jobs');
		} catch (error) {
			const errorMessage = error.response?.data?.message || error.message || 'Failed to delete crawl job';
			message.error(errorMessage);
		} finally {
			setConfirmLoading(false);
		}
	}
	const onClose = () => {
		setOpen(false);
	}

	return (
		<>
			<Button color='danger' variant='solid' onClick={() => setOpen(true)}>Delete </Button>
			{open && <CustomModal
				title="Delete Crawl Job"
				open={open}
				handleOk={handleOk}
				confirmLoading={confirmLoading}
				onClose={onClose}
			>
				<p>Are you sure you want to delete this crawl job?</p>
			</CustomModal>
			}
		</>
	)
}