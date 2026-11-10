import React, { useState } from 'react';
import { Alert, Button, Table, Typography, message } from 'antd';
import { CheckOutlined, CopyOutlined, ExportOutlined } from '@ant-design/icons';
import type { DocBlock } from '../../types/docSchema';
import DocImagePlaceholder from './DocImagePlaceholder';

const { Paragraph, Text, Title } = Typography;

interface DocBlockRendererProps {
	blocks: DocBlock[];
}

export default function DocBlockRenderer({ blocks }: DocBlockRendererProps) {
	const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

	const handleCopy = (code: string, idx: number) => {
		navigator.clipboard.writeText(code);
		setCopiedIdx(idx);
		message.success('Code copied to clipboard');
		setTimeout(() => setCopiedIdx(null), 2000);
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			{blocks.map((block, idx) => {
				switch (block.type) {
					case 'heading':
						return (
							<div key={idx} id={block.anchorId} style={{ scrollMarginTop: 80, marginTop: idx > 0 ? 12 : 0 }}>
								<Title level={block.level} style={{ margin: 0, color: '#141414', fontWeight: 600 }}>
									{block.text}
								</Title>
							</div>
						);

					case 'paragraph':
						return (
							<Paragraph key={idx} style={{ fontSize: 14, lineHeight: 1.8, color: '#333333', margin: 0 }}>
								{block.text}
							</Paragraph>
						);

					case 'callout': {
						const alertType =
							block.variant === 'warning'
								? 'warning'
								: block.variant === 'important'
								? 'error'
								: block.variant === 'tip'
								? 'success'
								: 'info';

						return (
							<Alert
								key={idx}
								type={alertType}
								showIcon
								message={block.title ? <Text strong>{block.title}</Text> : null}
								description={<span style={{ fontSize: 13, lineHeight: 1.6 }}>{block.text}</span>}
								style={{ borderRadius: 8, margin: '4px 0' }}
							/>
						);
					}

					case 'procedure':
						return (
							<div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
								{block.title && (
									<Title level={4} style={{ margin: '8px 0 4px', fontSize: 16 }}>
										{block.title}
									</Title>
								)}
								{block.steps.map((step) => (
									<div
										key={step.stepNumber}
										style={{
											border: '1px solid #f0f0f0',
											borderRadius: 8,
											padding: '16px 20px',
											backgroundColor: '#ffffff',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
											<div
												style={{
													width: 24,
													height: 24,
													borderRadius: '50%',
													backgroundColor: '#1677ff',
													color: '#ffffff',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontSize: 12,
													fontWeight: 600,
													flexShrink: 0,
												}}
											>
												{step.stepNumber}
											</div>
											<Text strong style={{ fontSize: 14, color: '#141414' }}>
												{step.title}
											</Text>
										</div>

										<Paragraph style={{ margin: '0 0 10px 34px', fontSize: 13, color: '#434343', lineHeight: 1.7 }}>
											{step.instruction}
										</Paragraph>

										{step.screenshot && (
											<div style={{ marginLeft: 34 }}>
												<DocImagePlaceholder screenshot={step.screenshot} />
											</div>
										)}

										{step.fields && step.fields.length > 0 && (
											<div style={{ marginLeft: 34, marginBottom: 12 }}>
												<Table
													size="small"
													pagination={false}
													dataSource={step.fields.map((f, fIdx) => ({ key: fIdx, ...f }))}
													columns={[
														{ title: 'Field Name', dataIndex: 'name', key: 'name', width: 180, render: (t) => <Text strong code>{t}</Text> },
														{ title: 'Required', dataIndex: 'required', key: 'required', width: 100, render: (r) => (r ? <span style={{ color: '#ff4d4f' }}>Yes</span> : <span style={{ color: '#8c8c8c' }}>Optional</span>) },
														{ title: 'Description', dataIndex: 'description', key: 'description' },
													]}
												/>
											</div>
										)}

										{step.expectedResult && (
											<div style={{ marginLeft: 34, fontSize: 12, color: '#389e0d', marginTop: 6 }}>
												<strong>Expected Result:</strong> {step.expectedResult}
											</div>
										)}

										{step.actionUrl && (
											<div style={{ marginLeft: 34, marginTop: 10 }}>
												<Button type="primary" size="small" ghost icon={<ExportOutlined />} href={step.actionUrl} target="_blank">
													{step.actionLabel || 'Open in CMS'}
												</Button>
											</div>
										)}
									</div>
								))}
							</div>
						);

					case 'image':
						return <DocImagePlaceholder key={idx} screenshot={block.screenshot} />;

					case 'code':
						return (
							<div
								key={idx}
								style={{
									position: 'relative',
									backgroundColor: '#1e1e1e',
									borderRadius: 8,
									padding: '16px 20px',
									color: '#d4d4d4',
									fontFamily: 'Consolas, monospace',
									fontSize: 13,
									lineHeight: 1.6,
									overflowX: 'auto',
								}}
							>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid #333', paddingBottom: 6 }}>
									<span style={{ fontSize: 11, color: '#858585', textTransform: 'uppercase' }}>{block.language}</span>
									<Button
										type="text"
										size="small"
										icon={copiedIdx === idx ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined style={{ color: '#858585' }} />}
										onClick={() => handleCopy(block.code, idx)}
										style={{ color: '#858585' }}
									>
										{copiedIdx === idx ? 'Copied' : 'Copy'}
									</Button>
								</div>
								<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{block.code}</pre>
							</div>
						);

					case 'table':
						return (
							<div key={idx} style={{ overflowX: 'auto', margin: '8px 0' }}>
								<Table
									size="small"
									pagination={false}
									dataSource={block.rows.map((row, rIdx) => ({
										key: rIdx,
										...row.reduce((acc, cell, cIdx) => ({ ...acc, [`c_${cIdx}`]: cell }), {}),
									}))}
									columns={block.headers.map((h, cIdx) => ({
										title: h,
										dataIndex: `c_${cIdx}`,
										key: `c_${cIdx}`,
									}))}
								/>
							</div>
						);

					case 'list':
						return block.ordered ? (
							<ol key={idx} style={{ paddingLeft: 22, margin: '4px 0', fontSize: 14, lineHeight: 1.8, color: '#333333' }}>
								{block.items.map((item, iIdx) => (
									<li key={iIdx}>{item}</li>
								))}
							</ol>
						) : (
							<ul key={idx} style={{ paddingLeft: 22, margin: '4px 0', fontSize: 14, lineHeight: 1.8, color: '#333333' }}>
								{block.items.map((item, iIdx) => (
									<li key={iIdx}>{item}</li>
								))}
							</ul>
						);

					default:
						return null;
				}
			})}
		</div>
	);
}
