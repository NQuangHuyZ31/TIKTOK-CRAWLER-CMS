import React from 'react';
import { Button, Input, Segmented, Space, Typography } from 'antd';
import { DashboardOutlined, MenuOutlined, RocketOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDocLanguage } from '../../context/DocLanguageContext';

const { Title } = Typography;

interface DocNavbarProps {
	onOpenSearch: () => void;
	onToggleMobileMenu?: () => void;
}

export default function DocNavbar({ onOpenSearch, onToggleMobileMenu }: DocNavbarProps) {
	const { language, setLanguage, t } = useDocLanguage();

	return (
		<header
			style={{
				position: 'sticky',
				top: 0,
				zIndex: 90,
				backgroundColor: '#ffffff',
				borderBottom: '1px solid #e8e8e8',
				height: 56,
				padding: '0 20px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
			}}
		>
			<Space size={12} align="center">
				{onToggleMobileMenu && <Button type="text" icon={<MenuOutlined />} onClick={onToggleMobileMenu} style={{ display: 'none' }} className="guideline-mobile-toggle" />}

				<Link to="/guideline" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
					<div
						style={{
							width: 30,
							height: 30,
							borderRadius: 6,
							backgroundColor: '#1677ff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: '#ffffff',
							fontSize: 16,
						}}
					>
						<RocketOutlined />
					</div>
					<div>
						<Title level={5} style={{ margin: 0, fontSize: 14, color: '#141414', lineHeight: 1.2 }}>
							{t('nav_brand', 'TikTok Crawler Docs', 'Tài liệu TikTok Crawler')}
						</Title>
					</div>
				</Link>
			</Space>

			{/* Search trigger button */}
			<div
				onClick={onOpenSearch}
				style={{
					flex: '0 1 360px',
					maxWidth: 400,
					cursor: 'pointer',
				}}
			>
				<Input
					readOnly
					placeholder={t('nav_search', 'Search documentation... (Ctrl + K)', 'Tìm kiếm tài liệu... (Ctrl + K)')}
					prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
					size="middle"
					style={{ borderRadius: 6, cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #e8e8e8' }}
				/>
			</div>

			{/* Language Switcher & Admin Link */}
			<Space size={12} align="center">
				<Segmented
					size="small"
					value={language}
					onChange={(val) => setLanguage(val as 'en' | 'vi')}
					options={[
						{ label: 'EN', value: 'en' },
						{ label: 'VI', value: 'vi' },
					]}
				/>

				<Button type="default" size="small" icon={<DashboardOutlined />} href="/admin/dashboard">
					Admin CMS
				</Button>
			</Space>
		</header>
	);
}
