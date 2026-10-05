import { Modal } from "antd";
import React from "react";

const CustomModal = ({ open, onClose, confirmLoading, title, children, handleOk }) => {
	if (!open) return null;

	return (
		<>
			<Modal
				title={title}
				open={open}
				onOk={handleOk}
				confirmLoading={confirmLoading}
				onCancel={onClose}
			>
				{children}
			</Modal>
		</>
	)
}

export default React.memo(CustomModal);