import React from 'react';
import { Card, Col, Row, Space, Typography } from 'antd';
import {
	BookOutlined,
	CheckCircleOutlined,
	RightOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDocLanguage } from '../../context/DocLanguageContext';

const { Paragraph, Text, Title } = Typography;

interface DocHomeContentProps {
	onOpenSearch: () => void;
}

export default function DocHomeContent({ onOpenSearch }: DocHomeContentProps) {
	const { language, t } = useDocLanguage();

	const quickLinks = language === 'vi' ? [
		{ title: 'Khởi động nhanh 5 phút', url: '/guideline/follow/quickstart', desc: 'Tạo và chạy tác vụ cào dữ liệu đầu tiên trong 3 bước' },
		{ title: 'Xác thực & Bảo mật Truy cập (2FA)', url: '/guideline/follow/auth-security-sop', desc: 'Hướng dẫn đăng nhập Google, kích hoạt 2FA TOTP và khôi phục tài khoản' },
		{ title: 'Kiến trúc Module Crawler', url: '/guideline/learn/crawler-module-architecture', desc: 'Hiểu rõ 3 chế độ crawl và hàng đợi SQLite WAL' },
		{ title: 'Quy trình Vận hành Crawl Jobs', url: '/guideline/follow/crawler-operations-sop', desc: 'Thao tác tạo, dừng, retry, sửa, xóa và kiểm tra chi tiết' },
	] : [
		{ title: '5-Minute Quick Start', url: '/guideline/follow/quickstart', desc: 'Run your first crawl job in 3 simple steps' },
		{ title: 'Authentication & Security Access SOP', url: '/guideline/follow/auth-security-sop', desc: 'Google login, 2FA TOTP setup, password recovery and administrative resets' },
		{ title: 'Crawler Module Architecture', url: '/guideline/learn/crawler-module-architecture', desc: 'Understand 3 crawl modes and SQLite WAL queue' },
		{ title: 'Crawl Jobs Operations SOP', url: '/guideline/follow/crawler-operations-sop', desc: 'Full lifecycle procedures: create, start, stop, retry, edit, delete' },
	];

	return (
		<div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 0 60px' }}>
			{/* Hero Title */}
			<div style={{ marginBottom: 32 }}>
				<Title level={1} style={{ margin: '0 0 8px', fontSize: 28, color: '#141414', fontWeight: 700 }}>
					{t('home.hero.title', 'CMS TikTok Crawler Documentation', 'Tài Liệu Hướng Dẫn Hệ Thống CMS TikTok Crawler')}
				</Title>
				<Paragraph type="secondary" style={{ fontSize: 15, margin: 0, lineHeight: 1.6 }}>
					{t(
						'home.hero.desc',
						'Welcome to the official technical documentation and user guides. Choose a pillar below to understand system architecture or follow step-by-step operational procedures.',
						'Chào mừng bạn đến với tài liệu kỹ thuật và hướng dẫn vận hành chính thức. Chọn một trụ cột bên dưới để tìm hiểu kiến trúc hệ thống hoặc thực hiện theo các quy trình vận hành từng bước.'
					)}
				</Paragraph>
			</div>

			{/* Two Primary Pillars (CloudPro Docs Core Entry) */}
			<Row gutter={[20, 20]} style={{ marginBottom: 36 }}>
				<Col xs={24} md={12}>
					<Link to="/guideline/learn/system-overview" style={{ textDecoration: 'none' }}>
						<Card
							hoverable
							style={{
								borderRadius: 10,
								borderColor: '#d6e4ff',
								height: '100%',
								backgroundColor: '#fafcff',
							}}
							bodyStyle={{ padding: 22 }}
						>
							<Space size={10} style={{ marginBottom: 10 }}>
								<div
									style={{
										width: 34,
										height: 34,
										borderRadius: 8,
										backgroundColor: '#1677ff',
										color: '#fff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: 18,
									}}
								>
									<BookOutlined />
								</div>
								<Title level={4} style={{ margin: 0, color: '#1677ff', fontSize: 17 }}>
									{t('home.pillar.learn.tag', 'LEARN', 'TÌM HIỂU')}
								</Title>
							</Space>
							<Text strong style={{ display: 'block', fontSize: 14, color: '#262626', marginBottom: 6 }}>
								{t('home.pillar.learn.title', 'Knowledge & Architecture', 'Kiến Thức & Nền Tảng')}
							</Text>
							<Paragraph type="secondary" style={{ fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
								{t(
									'home.pillar.learn.desc',
									'Learn how the system works: Monorepo topology, 3-layer DDD architecture, 3 crawl modes, SecUID identification, and webhook data flow.',
									'Tìm hiểu nguyên lý hoạt động: Cấu trúc monorepo, kiến trúc 3 lớp DDD, 3 chế độ cào dữ liệu, định danh SecUID và luồng dữ liệu webhook.'
								)}
							</Paragraph>
							<Text strong style={{ color: '#1677ff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
								{t('home.pillar.learn.link', 'Explore System Foundations', 'Khám Phá Nền Tảng Hệ Thống')}{' '}
								<RightOutlined style={{ fontSize: 10 }} />
							</Text>
						</Card>
					</Link>
				</Col>

				<Col xs={24} md={12}>
					<Link to="/guideline/follow/quickstart" style={{ textDecoration: 'none' }}>
						<Card
							hoverable
							style={{
								borderRadius: 10,
								borderColor: '#d9f7be',
								height: '100%',
								backgroundColor: '#f6ffed',
							}}
							bodyStyle={{ padding: 22 }}
						>
							<Space size={10} style={{ marginBottom: 10 }}>
								<div
									style={{
										width: 34,
										height: 34,
										borderRadius: 8,
										backgroundColor: '#52c41a',
										color: '#fff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: 18,
									}}
								>
									<CheckCircleOutlined />
								</div>
								<Title level={4} style={{ margin: 0, color: '#389e0d', fontSize: 17 }}>
									{t('home.pillar.follow.tag', 'FOLLOW', 'THỰC HÀNH')}
								</Title>
							</Space>
							<Text strong style={{ display: 'block', fontSize: 14, color: '#262626', marginBottom: 6 }}>
								{t('home.pillar.follow.title', 'Guides & Operational SOPs', 'Hướng Dẫn & Quy Trình Vận Hành')}
							</Text>
							<Paragraph type="secondary" style={{ fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
								{t(
									'home.pillar.follow.desc',
									'Actionable step-by-step procedures: 5-minute quickstart, scheduling crawl jobs, analyzing creator video galleries, and error recovery SOPs.',
									'Quy trình thao tác từng bước: Khởi động 5 phút, lập lịch crawl jobs, duyệt video creator và xử lý sự cố mã lỗi.'
								)}
							</Paragraph>
							<Text strong style={{ color: '#389e0d', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
								{t('home.pillar.follow.link', 'Start 5-Minute Quickstart', 'Bắt Đầu Quickstart 5 Phút')}{' '}
								<RightOutlined style={{ fontSize: 10 }} />
							</Text>
						</Card>
					</Link>
				</Col>
			</Row>

			{/* Quick Shortcuts */}
			<div>
				<Title level={4} style={{ margin: '0 0 14px', fontSize: 15, color: '#595959', textTransform: 'uppercase', letterSpacing: 0.5 }}>
					{t('home.quickLinks', 'Quick Links', 'Liên Kết Nhanh')}
				</Title>
				<Row gutter={[12, 12]}>
					{quickLinks.map((link, idx) => (
						<Col xs={24} sm={12} key={idx}>
							<Link to={link.url} style={{ textDecoration: 'none' }}>
								<div
									style={{
										padding: '12px 14px',
										borderRadius: 8,
										border: '1px solid #f0f0f0',
										backgroundColor: '#ffffff',
										display: 'flex',
										flexDirection: 'column',
										gap: 4,
										transition: 'all 0.15s ease',
									}}
								>
									<Text strong style={{ fontSize: 13, color: '#1677ff' }}>
										{link.title}
									</Text>
									<Text type="secondary" style={{ fontSize: 12 }}>
										{link.desc}
									</Text>
								</div>
							</Link>
						</Col>
					))}
				</Row>
			</div>
		</div>
	);
}
