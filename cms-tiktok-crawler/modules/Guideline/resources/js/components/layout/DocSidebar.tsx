import React, { useState } from 'react';
import { Typography } from 'antd';
import { BookOutlined, CheckCircleOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { getNavigationTree } from '../../navigation/docTree';
import { useDocLanguage } from '../../context/DocLanguageContext';

const { Text } = Typography;

export default function DocSidebar() {
	const location = useLocation();
	const currentPath = location.pathname;
	const { language } = useDocLanguage();
	const navTree = getNavigationTree(language);

	const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

	const toggleCategory = (catKey: string) => {
		setCollapsedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
	};

	return (
		<aside
			style={{
				width: 280,
				flexShrink: 0,
				borderRight: '1px solid #e8e8e8',
				backgroundColor: '#ffffff',
				height: 'calc(100vh - 56px)',
				position: 'sticky',
				top: 56,
				overflowY: 'auto',
				padding: '16px 12px 40px',
			}}
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
				{navTree.map((pillarGroup) => (
					<div key={pillarGroup.pillar}>
						{/* Pillar Header */}
						<div
							style={{
								padding: '4px 8px 8px',
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								color: '#8c8c8c',
								fontSize: 11,
								fontWeight: 700,
								letterSpacing: 0.8,
								textTransform: 'uppercase',
								borderBottom: '1px solid #f0f0f0',
								marginBottom: 8,
							}}
						>
							{pillarGroup.pillar === 'learn' ? (
								<BookOutlined style={{ color: '#1677ff' }} />
							) : (
								<CheckCircleOutlined style={{ color: '#52c41a' }} />
							)}
							<span>{pillarGroup.title}</span>
						</div>

						{/* Categories under Pillar */}
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							{pillarGroup.groups.map((cat) => {
								const catKey = `${pillarGroup.pillar}_${cat.category}`;
								const isCollapsed = Boolean(collapsedCategories[catKey]);

								return (
									<div key={cat.category}>
										<div
											onClick={() => toggleCategory(catKey)}
											style={{
												padding: '4px 8px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												cursor: 'pointer',
												fontSize: 12,
												fontWeight: 600,
												color: '#595959',
											}}
										>
											<span>{cat.category}</span>
											{isCollapsed ? (
												<RightOutlined style={{ fontSize: 9, color: '#bfbfbf' }} />
											) : (
												<DownOutlined style={{ fontSize: 9, color: '#bfbfbf' }} />
											)}
										</div>

										{!isCollapsed && (
											<div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
												{cat.items.map((item) => {
													const itemUrl = `/guideline/${item.pillar}/${item.slug}`;
													const isActive = currentPath === itemUrl;

													return (
														<Link
															key={item.slug}
															to={itemUrl}
															style={{
																padding: '6px 10px 6px 20px',
																borderRadius: 6,
																fontSize: 13,
																color: isActive ? '#1677ff' : '#434343',
																backgroundColor: isActive ? '#e6f4ff' : 'transparent',
																fontWeight: isActive ? 600 : 400,
																textDecoration: 'none',
																display: 'block',
																lineHeight: 1.4,
																transition: 'all 0.15s ease',
															}}
														>
															{item.title}
														</Link>
													);
												})}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</aside>
	);
}
