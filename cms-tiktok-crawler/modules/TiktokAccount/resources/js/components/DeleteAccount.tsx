import { Button } from "antd";
import { useDispatch } from '@core/store';
import CustomModal from "@core/components/CustomModal";
import { useState } from "react";
import { App as AntdApp } from "antd";
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
			{openModal && <CustomModal
				title="Delete Account"
				open={openModal}
				handleOk={handleDelete}
				confirmLoading={loadingDeleted}
				onClose={() => setOpenModal(false)}
			>
				<p>Are you sure you want to delete this account?</p>
			</CustomModal>
			}
		</>
	)
}

export default DeleteAccount;