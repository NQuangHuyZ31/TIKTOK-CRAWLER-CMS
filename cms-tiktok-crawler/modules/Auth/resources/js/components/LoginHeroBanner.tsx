import React from 'react';
import { Card, Flex, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, RobotOutlined, SafetyCertificateFilled, ThunderboltFilled } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function LoginHeroBanner() {
	return (
		<div
			style={{
				flex: 1,
				padding: '48px 40px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				background: 'linear-gradient(145deg, #090d16 0%, #0f172a 45%, #1e1b4b 100%)',
				borderRight: '1px solid rgba(255, 255, 255, 0.08)',
				color: '#ffffff',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: -80,
					right: -80,
					width: 260,
					height: 260,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(22, 119, 255, 0.25) 0%, transparent 70%)',
					filter: 'blur(40px)',
					pointerEvents: 'none',
				}}
			/>

			<div>
				<Flex align="center" gap={12} style={{ marginBottom: 32 }}>
					<div
						style={{
							width: 44,
							height: 44,
							borderRadius: 12,
							background: 'linear-gradient(135deg, #EC008C 0%, #6B217F 100%)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 22,
							boxShadow: '0 4px 14px rgba(236, 0, 140, 0.4)',
						}}
					>
						<RobotOutlined style={{ color: '#ffffff' }} />
					</div>
					<div>
						<Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>
							TikTok Crawler CMS
						</Title>
						<Text style={{ color: '#94a3b8', fontSize: 12 }}>Next-Gen Analytics & Channel Intelligence</Text>
					</div>
				</Flex>

				<Title level={2} style={{ color: '#f8fafc', fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>
					High-performance crawling with enterprise security.
				</Title>

				<Paragraph style={{ color: '#94a3b8', fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>
					Automate channel discovery, track engagement metrics with delta analytics, and secure administrative access with Google 2FA.
				</Paragraph>
			</div>

			<Card
				style={{
					background: 'rgba(255, 255, 255, 0.04)',
					border: '1px solid rgba(255, 255, 255, 0.1)',
					backdropFilter: 'blur(12px)',
					borderRadius: 14,
				}}
				styles={{ body: { padding: '20px' } }}
			>
				<Space direction="vertical" size={12} style={{ width: '100%' }}>
					<Flex align="center" gap={10}>
						<SafetyCertificateFilled style={{ color: '#10b981', fontSize: 18 }} />
						<Text style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>Google 2FA & TOTP Multi-factor Support</Text>
					</Flex>
					<Flex align="center" gap={10}>
						<ThunderboltFilled style={{ color: '#38bdf8', fontSize: 18 }} />
						<Text style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>Asynchronous Microservice Crawler Engine</Text>
					</Flex>
					<Flex align="center" gap={10}>
						<CheckCircleFilled style={{ color: '#a855f7', fontSize: 18 }} />
						<Text style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>Strict 3-Layer Role & Permission RBAC</Text>
					</Flex>
				</Space>
			</Card>
		</div>
	);
}
