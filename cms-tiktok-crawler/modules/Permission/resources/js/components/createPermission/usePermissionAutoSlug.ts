import { useEffect } from 'react';
import type { FormInstance } from 'antd';

export function usePermissionAutoSlug(form: FormInstance, open: boolean, watchedModule: string, watchedAction: string) {
	useEffect(() => {
		if (!open) return;
		const currentName = form.getFieldValue('name');
		const currentSlug = form.getFieldValue('slug');

		const cleanModule = watchedModule.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
		const cleanAction = watchedAction.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');

		if (cleanModule && cleanAction) {
			if (!currentSlug || currentSlug === form.getFieldValue('_auto_slug')) {
				const autoSlug = `${cleanModule}.${cleanAction}`;
				form.setFieldsValue({ slug: autoSlug, _auto_slug: autoSlug });
			}
			if (!currentName || currentName === form.getFieldValue('_auto_name')) {
				const capitalizedAction = cleanAction.charAt(0).toUpperCase() + cleanAction.slice(1);
				const capitalizedModule = cleanModule.charAt(0).toUpperCase() + cleanModule.slice(1);
				const autoName = `${capitalizedAction} ${capitalizedModule}`;
				form.setFieldsValue({ name: autoName, _auto_name: autoName });
			}
		}
	}, [watchedModule, watchedAction, open, form]);
}
