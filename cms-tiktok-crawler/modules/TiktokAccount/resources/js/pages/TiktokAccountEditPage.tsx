import { useEffect, useState } from 'react';
import {
	Alert,
	App as AntdApp,
	Button,
	Card,
	Form,
	Space,
} from 'antd';
import {
	SaveOutlined,
	ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import tiktokAccountAPI from '../Action/tiktokAccount';
import SpinComponent from '@core/components/SpinComponent';
import PageHeader from '@core/components/PageHeader';
import AccountFields from '../components/AccountField';
import AvatarUpload from '../components/AvatarUpload';

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
	const { id } = useParams();

	const [form] = Form.useForm();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [updateLoading, setUpdateLoading] = useState(false);

	/**
	 * Fetch account details directly via API
	 */
	useEffect(() => {
		if (!id) return;
		let mounted = true;
		setLoading(true);

		tiktokAccountAPI.getTiktokAccountByID(id)
			.then((res: any) => {
				if (!mounted) return;
				const currentAccount = res?.data ?? res;
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
			})
			.catch((err: any) => {
				if (!mounted) return;
				setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load TikTok account');
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, [id, form]);

	/**
	 * Handle avatar selection
	 */
	const handleAvatarChange = (file: any) => {
		setAvatarFile(file);

		const reader = new FileReader();
		reader.onload = (event: any) => {
			setAvatarPreview(event.target.result);
		};
		reader.readAsDataURL(file);

		return false;
	};

	/**
	 * Build multipart form data
	 */
	const buildFormData = (values: any) => {
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
	 * Submit form directly via API
	 */
	const handleSubmit = async (values: any) => {
		if (!id) return;
		try {
			setUpdateLoading(true);
			const formData = buildFormData(values);
			const result: any = await tiktokAccountAPI.updateTiktokAccount(id, formData);

			message.success(result?.message || 'TikTok account updated successfully');
			navigate(`/tiktok-account/${id}`);
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Update failed');
		} finally {
			setUpdateLoading(false);
		}
	};

	if (loading) {
		return <SpinComponent />;
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader
				title="Edit TikTok Account"
				subtitle="Manually update TikTok account profile details."
				onBack={() => navigate(`/tiktok-account/${id}`)}
			/>

			<Card style={{ maxWidth: 680 }}>
				{error && (
					<Alert
						type="error"
						message={error}
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

					<Space style={{ marginTop: 16 }}>
						<Button onClick={() => navigate(`/tiktok-account/${id}`)}>
							Cancel
						</Button>
						<Button
							type="primary"
							htmlType="submit"
							icon={<SaveOutlined />}
							loading={updateLoading}
						>
							Save Changes
						</Button>
					</Space>
				</Form>
			</Card>
		</div>
	);
}