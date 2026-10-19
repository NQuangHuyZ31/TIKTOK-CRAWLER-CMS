import { useEffect, useState } from 'react';
import {
	Alert,
	App as AntdApp,
	Button,
	Card,
	Form,
	Space,
	Typography,
} from 'antd';
import {
	SaveOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';

import {
	fetchTiktokAccountByID,
	updateTiktokAccount,
} from '@modules/TiktokAccount/resources/js/store/tiktokAccount/tiktokAccountThunks';

import SpinComponent from '@core/components/SpinComponent';
import AccountFields from '@modules/TiktokAccount/resources/js/components/AccountField';
import AvatarUpload from '@modules/TiktokAccount/resources/js/components/AvatarUpload';

const { Text, Title } = Typography;

const initialFormValues = {
	username: '',
	profile_url: '',
	following_count: 0,
	followers_count: 0,
	likes_count: 0,
	status: false,
};

export default function TiktokAccountEditPage() {
	const { message } = AntdApp.useApp();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { id } = useParams();

	const [form] = Form.useForm();

	const {
		currentAccount,
		loading,
		error,
	} = useSelector((state) => state.tiktokAccount);

	const [avatarPreview, setAvatarPreview] = useState(null);
	const [avatarFile, setAvatarFile] = useState(null);
	const [updateLoading, setUpdateLoading] = useState(false);

	/**
	 * Fetch account
	 */
	useEffect(() => {
		if (id) {
			dispatch(fetchTiktokAccountByID(id));
		}
	}, [dispatch, id]);

	/**
	 * Sync account data -> form
	 */
	useEffect(() => {
		if (!currentAccount || String(currentAccount.id) !== String(id)) {
			return;
		}

		form.setFieldsValue({
			username: currentAccount.username ?? '',
			profile_url: currentAccount.profile_url ?? '',
			following_count: currentAccount.following_count ?? 0,
			followers_count: currentAccount.followers_count ?? 0,
			likes_count: currentAccount.likes_count ?? 0,
			status: currentAccount.status === 'active',
		});

		setAvatarPreview(
			currentAccount.avatar_url ??
			currentAccount.avatar_path ??
			null
		);

		// Reset file khi load account mới
		setAvatarFile(null);
	}, [currentAccount, form, id]);

	/**
	 * Handle avatar selection
	 */
	const handleAvatarChange = (file) => {
		setAvatarFile(file);

		const reader = new FileReader();

		reader.onload = (event) => {
			setAvatarPreview(event.target.result);
		};

		reader.readAsDataURL(file);

		return false;
	};

	/**
	 * Build multipart form data
	 */
	const buildFormData = (values) => {
		const formData = new FormData();

		Object.entries(values).forEach(([key, value]) => {
			const formValue =
				key === 'status'
					? (value ? 'active' : 'inactive')
					: value;

			formData.append(key, String(formValue ?? ''));
		});

		if (avatarFile) {
			formData.append('avatar', avatarFile as Blob);
		}

		return formData;
	};

	/**
	 * Submit
	 */
	const handleSubmit = async (values) => {
		try {
			setUpdateLoading(true);

			const formData = buildFormData(values);

			const result = await dispatch(
				updateTiktokAccount({
					id,
					data: formData,
				})
			).unwrap();

			message.success(
				result?.message ?? 'Update completed'
			);

			navigate(`/tiktok-account/${id}`);
		} catch (error) {
			message.error(
				error?.message ??
				error ??
				'Update failed'
			);
		} finally {
			setUpdateLoading(false);
		}
	};

	return (
		<div>
			<Space
				orientation="vertical"
				size={4}
				style={{ marginBottom: 24 }}
			>
				<Title level={4} style={{ margin: 0 }}>
					Edit TikTok Account
				</Title>

				<Text type="secondary">
					Chỉnh sửa thông tin thủ công của tài khoản.
				</Text>
			</Space>

			<Card style={{ maxWidth: 680 }}>
				{error && (
					<Alert
						type="error"
						title={error}
						showIcon
						style={{ marginBottom: 24 }}
					/>
				)}

				<Form
					form={form}
					layout="vertical"
					initialValues={initialFormValues}
					onFinish={handleSubmit}
				>
					<AccountFields />

					<AvatarUpload
						preview={avatarPreview}
						onChange={handleAvatarChange}
					/>

					<Space>
						<Button
							type="primary"
							htmlType="submit"
							icon={<SaveOutlined />}
							loading={updateLoading}
							disabled={loading}
						>
							Lưu thay đổi
						</Button>
					</Space>
				</Form>
			</Card>

			{loading && <SpinComponent />}
		</div>
	);
}