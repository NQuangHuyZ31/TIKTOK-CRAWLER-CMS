import React, { useState } from 'react';
import { Modal, Form, Radio, DatePicker, InputNumber, Space, Button, Alert, Tag } from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

export interface ExportModalProps {
	open: boolean;
	onClose: () => void;
	endpoint: string;
	currentParams?: Record<string, any>;
	title?: string;
	dateFieldLabel?: string;
	dateFieldKey?: string;
	filenamePrefix?: string;
}

const PRESET_LIMITS = [100, 500, 1000, 5000];

export default function ExportModal({ open, onClose, endpoint, currentParams = {}, title = 'Export Data', dateFieldLabel = 'Date Range', dateFieldKey = 'created_at' }: ExportModalProps) {
	const [dateMode, setDateMode] = useState<'all' | 'range'>('all');
	const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
	const [limitMode, setLimitMode] = useState<'all' | 'custom'>('all');
	const [limitValue, setLimitValue] = useState<number>(1000);
	const [fileFormat, setFileFormat] = useState<'xlsx' | 'csv'>('csv');

	// Collect active filters for user visibility
	const activeFilters: Array<{ key: string; value: string }> = [];
	Object.entries(currentParams).forEach(([key, val]) => {
		if (['page', 'per_page', 'limit'].includes(key)) return;
		if (val !== undefined && val !== null && val !== '') {
			activeFilters.push({ key, value: String(val) });
		}
	});

	const handleExport = () => {
		const queryParams = new URLSearchParams();

		// Preserve current table filter/search params
		Object.entries(currentParams).forEach(([key, val]) => {
			if (['page', 'per_page', 'limit'].includes(key)) return;
			if (val !== undefined && val !== null && val !== '') {
				queryParams.append(key, String(val));
			}
		});

		// Date Range
		if (dateMode === 'range' && dateRange && dateRange[0] && dateRange[1]) {
			queryParams.append('export_date_from', dateRange[0].format('YYYY-MM-DD'));
			queryParams.append('export_date_to', dateRange[1].format('YYYY-MM-DD'));
		}

		// Limit
		queryParams.append('export_limit_type', limitMode);
		if (limitMode === 'custom' && limitValue > 0) {
			queryParams.append('export_limit', String(limitValue));
		}

		// Format
		queryParams.append('export_format', fileFormat);

		const separator = endpoint.includes('?') ? '&' : '?';
		const exportUrl = `${endpoint}${separator}${queryParams.toString()}`;

		window.open(exportUrl, '_blank');
		onClose();
	};

	return (
		<Modal
			title={
				<Space>
					<DownloadOutlined style={{ color: '#1677ff' }} />
					<span>{title}</span>
				</Space>
			}
			open={open}
			onCancel={onClose}
			destroyOnClose
			width={540}
			footer={[
				<Button key="cancel" onClick={onClose}>
					Cancel
				</Button>,
				<Button key="export" type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
					Export Now
				</Button>,
			]}
		>
			<div style={{ marginTop: 16 }}>
				{activeFilters.length > 0 && (
					<Alert
						style={{ marginBottom: 16 }}
						type="info"
						showIcon
						icon={<FilterOutlined />}
						message={
							<div>
								<div style={{ fontWeight: 500, marginBottom: 4 }}>Preserving Active Filters:</div>
								<Space size={[4, 4]} wrap>
									{activeFilters.map((f) => (
										<Tag key={f.key} color="blue">
											{f.key}: {f.value}
										</Tag>
									))}
								</Space>
							</div>
						}
					/>
				)}

				<Form layout="vertical">
					<Form.Item label={<span style={{ fontWeight: 600 }}>{dateFieldLabel}</span>}>
						<Radio.Group value={dateMode} onChange={(e) => setDateMode(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							<Radio value="all">All Dates (No date filter)</Radio>
							<Radio value="range">Specific Date Range</Radio>
						</Radio.Group>

						{dateMode === 'range' && (
							<div style={{ marginTop: 10, paddingLeft: 24 }}>
								<DatePicker.RangePicker style={{ width: '100%' }} value={dateRange} onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])} allowClear />
							</div>
						)}
					</Form.Item>

					<Form.Item label={<span style={{ fontWeight: 600 }}>Row Quantity / Limit</span>}>
						<Radio.Group value={limitMode} onChange={(e) => setLimitMode(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							<Radio value="all">All matching records</Radio>
							<Radio value="custom">Limit number of records</Radio>
						</Radio.Group>

						{limitMode === 'custom' && (
							<div style={{ marginTop: 10, paddingLeft: 24 }}>
								<Space direction="vertical" style={{ width: '100%' }} size={8}>
									<Space wrap>
										{PRESET_LIMITS.map((preset) => (
											<Button key={preset} size="small" type={limitValue === preset ? 'primary' : 'default'} onClick={() => setLimitValue(preset)}>
												{preset.toLocaleString()} rows
											</Button>
										))}
									</Space>
									<Space align="center">
										<span>Custom rows:</span>
										<InputNumber min={1} max={100000} value={limitValue} onChange={(val) => val && setLimitValue(val)} style={{ width: 140 }} />
									</Space>
								</Space>
							</div>
						)}
					</Form.Item>

					<Form.Item label={<span style={{ fontWeight: 600 }}>Export Format</span>}>
						<Radio.Group value={fileFormat} onChange={(e) => setFileFormat(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							{/* <Radio value="xlsx">
								<span style={{ fontWeight: 500 }}>Excel Workbook (.xlsx)</span>
								<Tag color="green" style={{ marginLeft: 8 }}>
									Recommended (Full Emoji & Unicode)
								</Tag>
							</Radio> */}
							<Radio value="csv">
								<span>CSV (.csv)</span>
								<Tag color="default" style={{ marginLeft: 8 }}>
									UTF-8 BOM
								</Tag>
							</Radio>
						</Radio.Group>
					</Form.Item>
				</Form>
			</div>
		</Modal>
	);
}
