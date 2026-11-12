import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Empty, Flex, Input, Space, Switch, Tag, Typography, message, theme } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { setHiddenModules, useHiddenModules, useToggleableModules } from '@core/routes/moduleVisibility';
import { getSystemSettings, updateSystemSettings, type ModuleVisibilitySettingsData } from '../../Action/systemSetting';

const { Text } = Typography;

export default function ModuleVisibilitySettings() {
	const { token } = theme.useToken();
	const currentHidden = useHiddenModules();
	const modules = useToggleableModules();
	const [draftHidden, setDraftHidden] = useState<string[]>([...currentHidden]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let mounted = true;
		setLoading(true);
		getSystemSettings<ModuleVisibilitySettingsData>('modules')
			.then((res) => {
				if (!mounted) return;
				const serverHidden = Array.isArray(res?.data?.settings?.hidden_modules)
					? res.data.settings.hidden_modules
					: [];
				setDraftHidden(serverHidden);
				setHiddenModules(serverHidden);
			})
			.catch(() => {
				if (mounted) setDraftHidden([...currentHidden]);
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const filteredModules = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return modules;
		return modules.filter(
			(mod) =>
				mod.name.toLowerCase().includes(q) ||
				mod.key.toLowerCase().includes(q) ||
				mod.path.toLowerCase().includes(q),
		);
	}, [modules, search]);

	const toggleModule = (moduleKey: string, visible: boolean) => {
		setDraftHidden((prev) => {
			if (visible) {
				return prev.filter((item) => item !== moduleKey);
			}
			return prev.includes(moduleKey) ? prev : [...prev, moduleKey];
		});
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await updateSystemSettings({ hidden_modules: draftHidden }, 'modules');
			const savedHidden = Array.isArray(res?.data?.settings?.hidden_modules)
				? (res.data.settings.hidden_modules as string[])
				: draftHidden;
			setDraftHidden(savedHidden);
			setHiddenModules(savedHidden);
			message.success('Module visibility settings updated.');
		} catch (err: any) {
			message.error(err?.message || 'Failed to update module visibility settings.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			<Alert
				type="info"
				showIcon
				message="Sidebar & URL Access Control"
				description="Modules are auto-discovered from the route registry. Disabled modules are immediately hidden from the sidebar and blocked from direct URL and API access. Core, Auth, and System modules remain protected."
			/>

			<Flex align="center" justify="space-between" gap={12} wrap="wrap">
				<Input
					allowClear
					prefix={<SearchOutlined />}
					placeholder="Filter modules by name, key, or path..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{ maxWidth: 360 }}
				/>
				<Text type="secondary">
					Showing {filteredModules.length} of {modules.length} modules
				</Text>
			</Flex>

			<div style={{ border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, overflow: 'hidden' }}>
				{filteredModules.length === 0 ? (
					<div style={{ padding: 24 }}>
						<Empty description="No matching modules found" />
					</div>
				) : (
					filteredModules.map((mod, idx) => {
						const isVisible = !draftHidden.includes(mod.key);
						return (
							<Flex
								key={mod.key}
								align="center"
								justify="space-between"
								gap={16}
								style={{
									padding: '14px 16px',
									borderBottom: idx < filteredModules.length - 1 ? `1px solid ${token.colorBorderSecondary}` : undefined,
									background: isVisible ? token.colorBgContainer : token.colorFillAlter,
								}}
							>
								<Space direction="vertical" size={2} style={{ minWidth: 0 }}>
									<Flex align="center" gap={8} wrap="wrap">
										<Text strong>{mod.name}</Text>
										<Tag color={isVisible ? 'success' : 'default'} icon={isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}>
											{isVisible ? 'Visible' : 'Hidden'}
										</Tag>
										<Text type="secondary" code style={{ fontSize: 12 }}>
											{mod.path}
										</Text>
										<Tag style={{ fontSize: 11 }}>{mod.key}</Tag>
									</Flex>
									<Text type="secondary" style={{ fontSize: 13 }}>
										{mod.description || `${mod.routeCount} registered route${mod.routeCount === 1 ? '' : 's'} under module "${mod.key}".`}
									</Text>
								</Space>

								<Switch
									checked={isVisible}
									loading={loading}
									checkedChildren="ON"
									unCheckedChildren="OFF"
									onChange={(checked) => toggleModule(mod.key, checked)}
								/>
							</Flex>
						);
					})
				)}
			</div>

			<Flex justify="flex-end">
				<Button
					type="primary"
					icon={<SaveOutlined />}
					loading={saving}
					disabled={loading}
					onClick={handleSave}
				>
					Save Module Visibility
				</Button>
			</Flex>
		</Space>
	);
}
