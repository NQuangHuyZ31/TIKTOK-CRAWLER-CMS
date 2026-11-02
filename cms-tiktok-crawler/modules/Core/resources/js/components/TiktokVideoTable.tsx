import React, { useMemo } from 'react';
import {
	Button,
	Card,
	DatePicker,
	Flex,
	Image,
	Input,
	Space,
	Tag,
	Typography,
} from 'antd';
import {
	CustomerServiceOutlined,
	EyeOutlined,
	HeartOutlined,
	LinkOutlined,
	ReloadOutlined,
	SearchOutlined,
	VideoCameraOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import TableComponent, { PaginationInfo } from './Table';
import NumericRangeFilter from './NumericRangeFilter';
import { formatNumber } from '../utils/formatNumber';
import { formatDateTime } from '../utils/formatDate';
import {
	createVideoTableColumns,
	formatDuration,
	VIDEO_LIKE_PRESETS,
	VIDEO_VIEW_PRESETS,
	VideoTableColumnOptions,
} from '../configs/videoTableConfig';

const { Text, Paragraph } = Typography;

export interface VideoFilterValues {
	search?: string;
	play_count?: string;
	digg_count?: string;
	published_at?: string;
	[key: string]: any;
}

export interface TiktokVideoTableProps {
	data: any[];
	loading?: boolean;
	pagination: PaginationInfo;
	onPageChange: (page: number, perPage: number) => void;
	onRefresh?: () => void;

	// Search & Filters
	filters?: VideoFilterValues;
	onFilterChange?: (key: keyof VideoFilterValues, value: any) => void;
	onResetFilters?: () => void;
	showFilters?: boolean;
	searchPlaceholder?: string;

	// Feature flags & layout options
	showAccount?: boolean;
	showVideoId?: boolean;
	showMusic?: boolean;
	showDeltas?: boolean;
	cardTitle?: React.ReactNode;
	extra?: React.ReactNode;
	bordered?: boolean;
	wrapInCard?: boolean;
}

export const renderStatWithDelta = (value: number, delta?: number, icon?: React.ReactNode) => (
	<Space size={4}>
		{icon}
		<Text strong>{formatNumber(value ?? 0)}</Text>
		{typeof delta === 'number' && delta !== 0 && (
			<Tag
				color={delta > 0 ? 'green' : 'volcano'}
				style={{ margin: 0, fontSize: 11, padding: '0 4px', lineHeight: '18px' }}
			>
				{delta > 0 ? `+${formatNumber(delta)}` : formatNumber(delta)}
			</Tag>
		)}
	</Space>
);

export default function TiktokVideoTable({
	data,
	loading = false,
	pagination,
	onPageChange,
	onRefresh,
	filters = {},
	onFilterChange,
	onResetFilters,
	showFilters = true,
	searchPlaceholder = 'Search by caption, ID...',
	showAccount = false,
	showVideoId = false,
	showMusic = true,
	showDeltas = false,
	cardTitle,
	extra,
	wrapInCard = true,
}: TiktokVideoTableProps) {
	const columnOptions: VideoTableColumnOptions = useMemo(
		() => ({
			showAccount,
			showVideoId,
			showMusic,
		}),
		[showAccount, showVideoId, showMusic],
	);

	const columns = useMemo(() => createVideoTableColumns(columnOptions), [columnOptions]);

	const renderColumns = useMemo(
		() => ({
			cover_url: (val: string, record: any) => (
				<Image
					width={60}
					height={80}
					src={val || record.dynamic_cover_url}
					style={{ objectFit: 'cover', borderRadius: 4 }}
					fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='80' fill='%23e5e7eb'><rect width='100%' height='100%'/></svg>"
				/>
			),
			video_id: (val: any) => (
				<Text code copyable={{ text: String(val) }} style={{ fontSize: 12 }}>
					{val}
				</Text>
			),
			username: (val: any) => (val ? <span style={{ fontWeight: 500 }}>@{val}</span> : '-'),
			description: (val: string, record: any) => {
				const tags = Array.isArray(record.hashtags) ? record.hashtags : [];
				return (
					<Space direction="vertical" size={4} style={{ width: '100%', maxWidth: 360 }}>
						<Paragraph
							ellipsis={{ rows: 2, expandable: true, symbol: 'More' }}
							style={{ margin: 0, fontSize: 13 }}
						>
							{val || '(No description)'}
						</Paragraph>
						{tags.length > 0 && (
							<Flex wrap="wrap" gap={4}>
								{tags.slice(0, 4).map((tag: string, idx: number) => (
									<Tag key={idx} color="blue" style={{ fontSize: 11, margin: 0 }}>
										#{tag}
									</Tag>
								))}
								{tags.length > 4 && (
									<Tag style={{ fontSize: 11, margin: 0 }}>+{tags.length - 4}</Tag>
								)}
							</Flex>
						)}
					</Space>
				);
			},
			duration: (val: number) => (
				<Tag color="default" style={{ fontFamily: 'monospace' }}>
					{formatDuration(val)}
				</Tag>
			),
			play_count: (val: any, record: any) =>
				showDeltas
					? renderStatWithDelta(val, record.play_count_delta, <EyeOutlined style={{ color: '#1677ff' }} />)
					: (
						<Space size={4}>
							<EyeOutlined style={{ color: '#1677ff' }} />
							<Text strong>{formatNumber(val ?? 0)}</Text>
						</Space>
					),
			digg_count: (val: any, record: any) =>
				showDeltas
					? renderStatWithDelta(val, record.digg_count_delta, <HeartOutlined style={{ color: '#fa8c16' }} />)
					: (
						<Space size={4}>
							<HeartOutlined style={{ color: '#fa8c16' }} />
							<Text>{formatNumber(val ?? 0)}</Text>
						</Space>
					),
			comment_count: (val: any, record: any) =>
				showDeltas ? renderStatWithDelta(val, record.comment_count_delta) : formatNumber(val ?? 0),
			share_count: (val: any, record: any) =>
				showDeltas ? renderStatWithDelta(val, record.share_count_delta) : formatNumber(val ?? 0),
			collect_count: (val: any, record: any) =>
				showDeltas ? renderStatWithDelta(val, record.collect_count_delta) : formatNumber(val ?? 0),
			music_title: (val: string, record: any) =>
				val ? (
					<Space size={6} style={{ maxWidth: 170 }}>
						<CustomerServiceOutlined style={{ color: '#722ed1', flexShrink: 0 }} />
						<Text
							ellipsis={{ tooltip: `${val}${record.music_author ? ` - ${record.music_author}` : ''}` }}
							style={{ fontSize: 12 }}
						>
							{val}
						</Text>
					</Space>
				) : (
					<Text type="secondary">-</Text>
				),
			published_at: (val: any) => (
				<Text type="secondary" style={{ fontSize: 12 }}>
					{val ? formatDateTime(val) : '-'}
				</Text>
			),
			video_url: (val: string) =>
				val ? (
					<Button
						type="link"
						size="small"
						icon={<LinkOutlined />}
						href={val}
						target="_blank"
						rel="noopener noreferrer"
					>
						Watch
					</Button>
				) : (
					'-'
				),
		}),
		[showDeltas],
	);

	const filterBar = showFilters && onFilterChange && (
		<Flex wrap="wrap" gap={8} align="center" style={{ marginBottom: 16 }}>
			<Input
				placeholder={searchPlaceholder}
				prefix={<SearchOutlined />}
				allowClear
				value={filters.search}
				onChange={(e) => onFilterChange('search', e.target.value)}
				style={{ width: 220 }}
			/>
			<NumericRangeFilter
				placeholder="Views"
				value={filters.play_count}
				presets={VIDEO_VIEW_PRESETS}
				onChange={(val) => onFilterChange('play_count', val)}
				width={140}
			/>
			<NumericRangeFilter
				placeholder="Likes"
				value={filters.digg_count}
				presets={VIDEO_LIKE_PRESETS}
				onChange={(val) => onFilterChange('digg_count', val)}
				width={140}
			/>
			<DatePicker
				placeholder="Published At"
				value={filters.published_at ? dayjs(filters.published_at) : undefined}
				onChange={(date) =>
					onFilterChange(
						'published_at',
						date && date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : undefined,
					)
				}
				style={{ width: 160 }}
			/>
			{onResetFilters && (
				<Button onClick={onResetFilters}>
					Reset Filters
				</Button>
			)}
			{onRefresh && (
				<Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
					Refresh
				</Button>
			)}
		</Flex>
	);

	const content = (
		<>
			{filterBar}
			<TableComponent
				columns={columns}
				data={data}
				pagination={pagination}
				handlePageChange={onPageChange}
				loading={loading}
				renderColumns={renderColumns}
			/>
		</>
	);

	if (!wrapInCard) {
		return content;
	}

	const defaultTitle = (
		<Space size={8}>
			<VideoCameraOutlined />
			<span>
				{cardTitle ?? 'Crawled TikTok Videos'} ({formatNumber(pagination.total || 0)})
			</span>
		</Space>
	);

	return (
		<Card title={defaultTitle} extra={extra}>
			{content}
		</Card>
	);
}
