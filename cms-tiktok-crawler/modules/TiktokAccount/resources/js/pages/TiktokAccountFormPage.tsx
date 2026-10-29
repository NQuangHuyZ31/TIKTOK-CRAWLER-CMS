import React from 'react';
import { Form } from 'antd';
import tiktokAccountAPI from '../Action/tiktokAccount';
import ResourceForm from '@core/components/ResourceForm';
import UploadComponent from '@core/components/UploadComponent';
import AccountFields from '../components/AccountField';

const initialFormValues = {
	username: '',
	nickname: '',
	profile_url: '',
	bio: '',
	following_count: 0,
	followers_count: 0,
	likes_count: 0,
	video_count: 0,
	status: true,
	is_verified: false,
};

/**
 * Unified TikTok Account Form page for Create and Edit operations
 * using shared ResourceForm component and UploadComponent.
 */
export default function TiktokAccountFormPage() {
	const buildFormData = (values: Record<string, any>) => {
		const formData = new FormData();

		Object.entries(values).forEach(([key, value]) => {
			if (key === 'avatar') {
				if (value instanceof File) {
					formData.append('avatar', value);
				}
				return;
			}

			if (key === 'status') {
				formData.append('status', value ? 'active' : 'inactive');
				return;
			}

			if (key === 'is_verified') {
				formData.append('is_verified', value ? '1' : '0');
				return;
			}

			if (value !== undefined && value !== null) {
				formData.append(key, String(value));
			}
		});

		return formData;
	};

	return (
		<ResourceForm
			resourceName="TikTok Account"
			fetchRecord={async (id) => {
				const res = await tiktokAccountAPI.getTiktokAccountByID(id);
				return res?.data ?? res;
			}}
			transformInitialValues={(currentAccount) => ({
				username: currentAccount.username ?? '',
				nickname: currentAccount.nickname ?? '',
				profile_url: currentAccount.profile_url ?? '',
				bio: currentAccount.bio ?? '',
				following_count: currentAccount.following_count ?? 0,
				followers_count: currentAccount.followers_count ?? 0,
				likes_count: currentAccount.likes_count ?? 0,
				video_count: currentAccount.video_count ?? 0,
				status: currentAccount.status === 'active',
				is_verified: Boolean(currentAccount.is_verified),
				avatar: currentAccount.avatar_path ?? null,
			})}
			initialValues={initialFormValues}
			onCreate={async (values) => {
				const formData = buildFormData(values);
				return await tiktokAccountAPI.createTiktokAccount(formData);
			}}
			onUpdate={async (id, values) => {
				const formData = buildFormData(values);
				return await tiktokAccountAPI.updateTiktokAccount(id, formData);
			}}
			backUrl="/tiktok-account"
			redirectUrl={(result, isEdit, id) => {
				if (isEdit && id) {
					return `/tiktok-account/${id}`;
				}
				const createdId = result?.data?.id ?? result?.id;
				return createdId ? `/tiktok-account/${createdId}` : '/tiktok-account';
			}}
		>
			<AccountFields />

			<Form.Item name="avatar" label="Avatar" extra="Supported formats: JPG, PNG, WEBP. Max size: 2MB.">
				<UploadComponent variant="avatar" maxSizeMB={2} accept="image/*" />
			</Form.Item>
		</ResourceForm>
	);
}
