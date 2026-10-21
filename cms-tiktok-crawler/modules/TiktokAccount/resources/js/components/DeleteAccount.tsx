import { Button, App as AntdApp } from "antd";
import { useDispatch } from '@core/store';
import ConfirmDialog from "@core/components/ConfirmDialog";
import { useState } from "react";
import { deleteTiktokAccount } from "../store/tiktokAccount/tiktokAccountThunks";
import { useNavigate } from "react-router-dom";

const DeleteAccount = ({ accountId, redirectOnDelete = true, textOnly = false }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { message } = AntdApp.useApp();
	const [openModal, setOpenModal] = useState(false);
	const [loadingDeleted, setLoadingDeleted] = useState(false);

	const handleDelete = async () => {
		setLoadingDeleted(true);
		try {
			const result = await dispatch(deleteTiktokAccount(accountId)).unwrap();

			message.success(result?.message || 'Delete completed');
			setOpenModal(false);
			if (redirectOnDelete) {
				navigate('/tiktok-account');
			}
		} catch (error) {
			message.error(error?.message || error || 'Delete failed');
		} finally {
			setLoadingDeleted(false);
		}
	};

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
			<ConfirmDialog
				open={openModal}
				title="Delete Account"
				content="Are you sure you want to delete this account?"
				onConfirm={handleDelete}
				onCancel={() => setOpenModal(false)}
				confirmLoading={loadingDeleted}
				danger
			/>
		</>
	);
};

export default DeleteAccount;