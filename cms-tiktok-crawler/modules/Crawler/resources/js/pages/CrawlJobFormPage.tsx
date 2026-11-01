import React, { useMemo } from 'react';
import {
	Alert,
	Badge,
	Button,
	Card,
	Col,
	Divider,
	Flex,
	Form,
	Input,
	InputNumber,
	Radio,
	Row,
	Slider,
	Space,
	Tag,
	Tooltip,
	Typography,
	theme,
} from 'antd';
import {
	BulbOutlined,
	CheckCircleFilled,
	ClearOutlined,
	CompassOutlined,
	DatabaseOutlined,
	InfoCircleOutlined,
	LinkOutlined,
	NumberOutlined,
	RocketOutlined,
	SlidersOutlined,
	UserOutlined,
	VideoCameraOutlined,
} from '@ant-design/icons';
import crawlJobAPI from '@modules/Crawler/resources/js/Action/crawlJob';
import {
	COUNT_PRESETS,
	SAMPLE_PROFILE_URLS,
	SAMPLE_USERNAMES,
	SAMPLE_VIDEO_URLS,
	VIDEO_LIMIT_PRESETS,
} from '@modules/Crawler/resources/js/configs/crawlerOptions';
import TiktokAccountSelect from '@modules/Crawler/resources/js/components/TiktokAccountSelect';
import ResourceForm, { type ResourceFormRenderContext } from '@core/components/ResourceForm';
import { formatNumber } from '@core/utils/formatNumber';

const { Text, Title, Paragraph } = Typography;

export function extractCleanUsernames(text?: string): string[] {
	if (!text) return [];
	const items = text
		.split(/[\n,;]+/)
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			const match = entry.match(/tiktok\.com\/@([a-zA-Z0-9._]+)/);
			if (match && match[1]) {
				return match[1];
			}
			return entry.replace(/^@+/, '').trim();
		})
		.filter(Boolean);

	return Array.from(new Set(items));
}

export function extractCleanUrls(text?: string): string[] {
	if (!text) return [];
	const items = text
		.split(/[\n,;]+/)
		.map((entry) => entry.trim())
		.filter(Boolean);

	return Array.from(new Set(items));
}

/**
 * Isolated form fields component obeying React Rules of Hooks.
 * Encapsulates Form.useWatch and field rendering.
 */
function CrawlJobFormFields({ form, isEdit, record }: ResourceFormRenderContext) {
	const { token } = theme.useToken();
	const sourceType = Form.useWatch('source_type', form) || 'usernames';
	const crawlMode = Form.useWatch('crawl_mode', form) || 'account_with_videos';
	const maxVideos = Form.useWatch('max_videos_per_account', form) ?? 20;
	const usernamesRaw = Form.useWatch('usernames', form) || '';
	const urlsRaw = Form.useWatch('urls', form) || '';
	const accountIds = Form.useWatch('account_ids', form) || [];
	const totalAccounts = Form.useWatch('total_accounts', form) || 0;

	const isReadOnly = Boolean(isEdit && record && record.status !== 'pending');

	// Real-time parsed items count
	const parsedUsernames = useMemo(() => extractCleanUsernames(usernamesRaw), [usernamesRaw]);
	const parsedUrls = useMemo(() => extractCleanUrls(urlsRaw), [urlsRaw]);

	const handleCrawlModeSelect = (mode: 'account_with_videos' | 'account_only' | 'video_only') => {
		if (isReadOnly) return;
		if (mode === 'video_only') {
			form.setFieldsValue({
				crawl_mode: mode,
				source_type: 'urls',
			});
		} else {
			form.setFieldsValue({
				crawl_mode: mode,
			});
		}
	};

	const handleSourceChange = (val: string) => {
		form.setFieldsValue({
			source_type: val,
			usernames: undefined,
			urls: undefined,
			account_ids: [],
			total_accounts: undefined,
		});
	};

	const handleInsertSample = () => {
		if (sourceType === 'usernames') {
			form.setFieldsValue({ usernames: SAMPLE_USERNAMES });
		} else if (sourceType === 'urls') {
			form.setFieldsValue({
				urls: crawlMode === 'video_only' ? SAMPLE_VIDEO_URLS : SAMPLE_PROFILE_URLS,
			});
		}
	};

	const handleClearInput = () => {
		if (sourceType === 'usernames') {
			form.setFieldsValue({ usernames: '' });
		} else if (sourceType === 'urls') {
			form.setFieldsValue({ urls: '' });
		}
	};

	// Target summary calculations
	const targetCount = useMemo(() => {
		if (sourceType === 'usernames') return parsedUsernames.length;
		if (sourceType === 'urls') return parsedUrls.length;
		if (sourceType === 'database') return accountIds.length;
		if (sourceType === 'count') return Number(totalAccounts) || 0;
		return 0;
	}, [sourceType, parsedUsernames.length, parsedUrls.length, accountIds.length, totalAccounts]);

	const estimatedVideos = useMemo(() => {
		if (crawlMode === 'video_only') return targetCount;
		if (crawlMode === 'account_only') return 0;
		return targetCount * Number(maxVideos);
	}, [crawlMode, targetCount, maxVideos]);

	return (
		<Space direction="vertical" size={20} style={{ width: '100%' }}>
			{isReadOnly && (
				<Alert
					type="warning"
					message="Job này không còn ở trạng thái Chờ xử lý (Pending) nên không thể chỉnh sửa thông số."
					showIcon
				/>
			)}

			{/* ================= STEP 1: CHẾ ĐỘ THU THẬP ================= */}
			<Card
				size="small"
				title={
					<Space size={8}>
						<CompassOutlined style={{ color: token.colorPrimary }} />
						<Text strong style={{ fontSize: 15 }}>
							1. Chọn chế độ thu thập (Crawl Scope)
						</Text>
					</Space>
				}
				style={{ borderColor: token.colorBorderSecondary }}
			>
				<Form.Item name="crawl_mode" hidden>
					<Input />
				</Form.Item>

				<Row gutter={[16, 16]}>
					{/* Mode: Account + Videos */}
					<Col xs={24} md={8}>
						<Card
							hoverable={!isReadOnly}
							onClick={() => handleCrawlModeSelect('account_with_videos')}
							style={{
								height: '100%',
								cursor: isReadOnly ? 'not-allowed' : 'pointer',
								borderColor:
									crawlMode === 'account_with_videos'
										? token.colorPrimary
										: token.colorBorderSecondary,
								backgroundColor:
									crawlMode === 'account_with_videos' ? `${token.colorPrimary}0a` : undefined,
								borderWidth: crawlMode === 'account_with_videos' ? 2 : 1,
								transition: 'all 0.2s',
								position: 'relative',
							}}
							styles={{ body: { padding: '16px' } }}
						>
							<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
								<Space size={10}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 8,
											backgroundColor: `${token.colorPrimary}18`,
											color: token.colorPrimary,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 18,
										}}
									>
										<VideoCameraOutlined />
									</div>
									<div>
										<Text strong style={{ fontSize: 14, display: 'block' }}>
											Tài khoản + Video
										</Text>
										<Text type="secondary" style={{ fontSize: 12 }}>
											Toàn diện & Chi tiết
										</Text>
									</div>
								</Space>
								{crawlMode === 'account_with_videos' && (
									<CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 18 }} />
								)}
							</Flex>
							<Paragraph
								type="secondary"
								style={{ fontSize: 12, marginBottom: 8, minHeight: 36 }}
							>
								Thu thập trọn gói hồ sơ kênh (follower, likes, bio...) cùng tối đa N video mới nhất kèm tương tác.
							</Paragraph>
							<Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
								Khuyên dùng
							</Tag>
						</Card>
					</Col>

					{/* Mode: Account Only */}
					<Col xs={24} md={8}>
						<Card
							hoverable={!isReadOnly}
							onClick={() => handleCrawlModeSelect('account_only')}
							style={{
								height: '100%',
								cursor: isReadOnly ? 'not-allowed' : 'pointer',
								borderColor:
									crawlMode === 'account_only' ? token.colorPrimary : token.colorBorderSecondary,
								backgroundColor:
									crawlMode === 'account_only' ? `${token.colorPrimary}0a` : undefined,
								borderWidth: crawlMode === 'account_only' ? 2 : 1,
								transition: 'all 0.2s',
								position: 'relative',
							}}
							styles={{ body: { padding: '16px' } }}
						>
							<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
								<Space size={10}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 8,
											backgroundColor: '#13c2c218',
											color: '#13c2c2',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 18,
										}}
									>
										<UserOutlined />
									</div>
									<div>
										<Text strong style={{ fontSize: 14, display: 'block' }}>
											Chỉ tài khoản
										</Text>
										<Text type="secondary" style={{ fontSize: 12 }}>
											Nhanh & Tinh gọn
										</Text>
									</div>
								</Space>
								{crawlMode === 'account_only' && (
									<CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 18 }} />
								)}
							</Flex>
							<Paragraph
								type="secondary"
								style={{ fontSize: 12, marginBottom: 8, minHeight: 36 }}
							>
								Chỉ cào thông tin kênh (Followers, Following, Likes, Bio, Avatar). Bỏ qua video để tăng tốc độ.
							</Paragraph>
							<Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>
								Tốc độ cao
							</Tag>
						</Card>
					</Col>

					{/* Mode: Video URLs Only */}
					<Col xs={24} md={8}>
						<Card
							hoverable={!isReadOnly}
							onClick={() => handleCrawlModeSelect('video_only')}
							style={{
								height: '100%',
								cursor: isReadOnly ? 'not-allowed' : 'pointer',
								borderColor:
									crawlMode === 'video_only' ? token.colorPrimary : token.colorBorderSecondary,
								backgroundColor:
									crawlMode === 'video_only' ? `${token.colorPrimary}0a` : undefined,
								borderWidth: crawlMode === 'video_only' ? 2 : 1,
								transition: 'all 0.2s',
								position: 'relative',
							}}
							styles={{ body: { padding: '16px' } }}
						>
							<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
								<Space size={10}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 8,
											backgroundColor: '#fa8c1618',
											color: '#fa8c16',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 18,
										}}
									>
										<LinkOutlined />
									</div>
									<div>
										<Text strong style={{ fontSize: 14, display: 'block' }}>
											Chỉ URLs Video
										</Text>
										<Text type="secondary" style={{ fontSize: 12 }}>
											Mục tiêu độc lập
										</Text>
									</div>
								</Space>
								{crawlMode === 'video_only' && (
									<CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 18 }} />
								)}
							</Flex>
							<Paragraph
								type="secondary"
								style={{ fontSize: 12, marginBottom: 8, minHeight: 36 }}
							>
								Thu thập chi tiết các video cụ thể trực tiếp từ đường dẫn URL mà không cần cào thông tin kênh.
							</Paragraph>
							<Tag color="orange" style={{ fontSize: 11, margin: 0 }}>
								Video trực tiếp
							</Tag>
						</Card>
					</Col>
				</Row>
			</Card>

			{/* ================= STEP 2: NGUỒN DỮ LIỆU ĐẦU VÀO ================= */}
			<Card
				size="small"
				title={
					<Space size={8}>
						<DatabaseOutlined style={{ color: token.colorPrimary }} />
						<Text strong style={{ fontSize: 15 }}>
							2. Nguồn dữ liệu mục tiêu (Target Source)
						</Text>
					</Space>
				}
				style={{ borderColor: token.colorBorderSecondary }}
			>
				<Form.Item
					name="source_type"
					label="Phương thức cung cấp mục tiêu"
					style={{ marginBottom: 16 }}
				>
					<Radio.Group
						optionType="button"
						buttonStyle="solid"
						onChange={(e) => handleSourceChange(e.target.value)}
						disabled={isReadOnly || crawlMode === 'video_only'}
					>
						<Radio.Button value="usernames">
							<UserOutlined /> Username TikTok
						</Radio.Button>
						<Radio.Button value="urls">
							<LinkOutlined /> Đường dẫn URL
						</Radio.Button>
						<Radio.Button value="database">
							<DatabaseOutlined /> Chọn từ Database
						</Radio.Button>
						<Radio.Button value="count">
							<NumberOutlined /> Lấy mẫu ngẫu nhiên (Count)
						</Radio.Button>
					</Radio.Group>
				</Form.Item>

				{/* 2A. Source: Usernames */}
				{sourceType === 'usernames' && (
					<div>
						<Flex justify="space-between" align="center" style={{ marginBottom: 8 }} wrap="wrap" gap={8}>
							<Space size={8}>
								<Text strong>Danh sách Username TikTok:</Text>
								<Tag color={parsedUsernames.length > 0 ? 'processing' : 'default'}>
									Đã nhận diện: {formatNumber(parsedUsernames.length)} username
								</Tag>
							</Space>

							{!isReadOnly && (
								<Space size={6}>
									<Button
										size="small"
										type="dashed"
										icon={<BulbOutlined />}
										onClick={handleInsertSample}
									>
										Dán mẫu thử
									</Button>
									{usernamesRaw && (
										<Button
											size="small"
											type="text"
											danger
											icon={<ClearOutlined />}
											onClick={handleClearInput}
										>
											Xoá
										</Button>
									)}
								</Space>
							)}
						</Flex>

						<Form.Item
							preserve={false}
							name="usernames"
							rules={[{ required: true, message: 'Vui lòng nhập ít nhất một username TikTok' }]}
							style={{ marginBottom: 8 }}
						>
							<Input.TextArea
								rows={6}
								disabled={isReadOnly}
								placeholder={`khaby.lame\nmrbeast\nzachking\n(Mỗi username trên một dòng, tự động hỗ trợ bỏ ký tự @ hoặc dán cả link TikTok)`}
								style={{ fontFamily: 'monospace', fontSize: 13 }}
							/>
						</Form.Item>

						<Text type="secondary" style={{ fontSize: 12 }}>
							<InfoCircleOutlined style={{ marginRight: 4 }} />
							Nhập mỗi username trên một dòng hoặc phân tách bằng dấu phẩy. Hệ thống sẽ tự động loại bỏ ký tự <code>@</code> và lọc bỏ dòng trùng lặp.
						</Text>
					</div>
				)}

				{/* 2B. Source: URLs */}
				{sourceType === 'urls' && (
					<div>
						<Flex justify="space-between" align="center" style={{ marginBottom: 8 }} wrap="wrap" gap={8}>
							<Space size={8}>
								<Text strong>
									{crawlMode === 'video_only'
										? 'Danh sách URL Video TikTok:'
										: 'Danh sách URL Kênh TikTok:'}
								</Text>
								<Tag color={parsedUrls.length > 0 ? 'processing' : 'default'}>
									Đã nhận diện: {formatNumber(parsedUrls.length)} URL
								</Tag>
							</Space>

							{!isReadOnly && (
								<Space size={6}>
									<Button
										size="small"
										type="dashed"
										icon={<BulbOutlined />}
										onClick={handleInsertSample}
									>
										Dán mẫu URL
									</Button>
									{urlsRaw && (
										<Button
											size="small"
											type="text"
											danger
											icon={<ClearOutlined />}
											onClick={handleClearInput}
										>
											Xoá
										</Button>
									)}
								</Space>
							)}
						</Flex>

						<Form.Item
							preserve={false}
							name="urls"
							rules={[{ required: true, message: 'Vui lòng nhập ít nhất một URL TikTok' }]}
							style={{ marginBottom: 8 }}
						>
							<Input.TextArea
								rows={6}
								disabled={isReadOnly}
								placeholder={
									crawlMode === 'video_only'
										? `https://www.tiktok.com/@khaby.lame/video/735000111222333444\nhttps://www.tiktok.com/@mrbeast/video/736000111222333444`
										: `https://www.tiktok.com/@khaby.lame\nhttps://www.tiktok.com/@mrbeast`
								}
								style={{ fontFamily: 'monospace', fontSize: 13 }}
							/>
						</Form.Item>

						<Text type="secondary" style={{ fontSize: 12 }}>
							<InfoCircleOutlined style={{ marginRight: 4 }} />
							{crawlMode === 'video_only'
								? 'Mỗi dòng một link video TikTok hợp lệ (định dạng https://www.tiktok.com/@user/video/id).'
								: 'Mỗi dòng một link hồ sơ kênh TikTok hợp lệ. Hệ thống sẽ tự động phân giải username tương ứng.'}
						</Text>
					</div>
				)}

				{/* 2C. Source: Database */}
				{sourceType === 'database' && (
					<TiktokAccountSelect
						disabled={isReadOnly}
						onChange={(value) => form.setFieldsValue({ account_ids: value })}
					/>
				)}

				{/* 2D. Source: Count */}
				{sourceType === 'count' && (
					<div>
						<Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
							<Text strong>Số lượng tài khoản cần lấy mẫu:</Text>
							{!isReadOnly && (
								<Space size={4}>
									{COUNT_PRESETS.map((preset) => (
										<Button
											key={preset}
											size="small"
											type={totalAccounts === preset ? 'primary' : 'dashed'}
											onClick={() => form.setFieldsValue({ total_accounts: preset })}
										>
											{preset}
										</Button>
									))}
								</Space>
							)}
						</Flex>

						<Form.Item
							name="total_accounts"
							rules={[{ required: true, message: 'Vui lòng nhập số lượng tài khoản cần lấy mẫu' }]}
							style={{ marginBottom: 8 }}
						>
							<InputNumber
								min={1}
								max={10000}
								precision={0}
								style={{ width: '100%' }}
								placeholder="Nhập số lượng tài khoản muốn lấy ngẫu nhiên từ DB"
								disabled={isReadOnly}
							/>
						</Form.Item>

						<Text type="secondary" style={{ fontSize: 12 }}>
							<InfoCircleOutlined style={{ marginRight: 4 }} />
							Hệ thống sẽ tự động truy vấn N tài khoản trong cơ sở dữ liệu có thời gian cập nhật xa nhất để tái cào dữ liệu mới nhất.
						</Text>
					</div>
				)}
			</Card>

			{/* ================= STEP 3: CẤU HÌNH VIDEO (KHI CHỌN ACCOUNT + VIDEOS) ================= */}
			{crawlMode === 'account_with_videos' && (
				<Card
					size="small"
					title={
						<Space size={8}>
							<SlidersOutlined style={{ color: token.colorPrimary }} />
							<Text strong style={{ fontSize: 15 }}>
								3. Cấu hình thu thập Video (Video Parameters)
							</Text>
						</Space>
					}
					style={{ borderColor: token.colorBorderSecondary }}
				>
					<Flex justify="space-between" align="center" style={{ marginBottom: 12 }} wrap="wrap" gap={8}>
						<div>
							<Text strong>Số lượng video mới nhất mỗi tài khoản:</Text>
							<Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
								Giới hạn từ 1 đến 100 video gần nhất được công bố bởi mỗi creator.
							</Paragraph>
						</div>

						{!isReadOnly && (
							<Space size={6} wrap>
								{VIDEO_LIMIT_PRESETS.map((item) => (
									<Tooltip key={item.value} title={item.desc}>
										<Button
											size="small"
											type={maxVideos === item.value ? 'primary' : 'dashed'}
											onClick={() => form.setFieldsValue({ max_videos_per_account: item.value })}
										>
											{item.label}
										</Button>
									</Tooltip>
								))}
							</Space>
						)}
					</Flex>

					<Row gutter={24} align="middle">
						<Col xs={24} sm={16} md={18}>
							<Form.Item name="max_videos_per_account" noStyle>
								<Slider
									min={1}
									max={100}
									disabled={isReadOnly}
									marks={{
										1: '1',
										10: '10',
										20: '20 (Chuẩn)',
										50: '50',
										100: '100 (Max)',
									}}
								/>
							</Form.Item>
						</Col>
						<Col xs={24} sm={8} md={6}>
							<Form.Item
								name="max_videos_per_account"
								rules={[{ required: true, message: 'Vui lòng chỉ định số video tối đa' }]}
								noStyle
							>
								<InputNumber
									min={1}
									max={100}
									precision={0}
									addonAfter="video/kênh"
									style={{ width: '100%' }}
									disabled={isReadOnly}
								/>
							</Form.Item>
						</Col>
					</Row>

					<Divider style={{ margin: '16px 0 12px' }} />

					<Flex align="center" gap={8}>
						<Tag color="cyan">Thời gian ước tính</Tag>
						<Text type="secondary" style={{ fontSize: 12 }}>
							Thu thập ~{maxVideos} video mỗi tài khoản thông thường mất khoảng 20-40 giây trên mỗi kênh.
						</Text>
					</Flex>
				</Card>
			)}

			{/* ================= STEP 4: TÓM TẮT THÔNG SỐ (JOB SUMMARY) ================= */}
			<Card
				size="small"
				style={{
					backgroundColor: `${token.colorPrimary}06`,
					borderColor: `${token.colorPrimary}30`,
				}}
				styles={{ body: { padding: '16px 20px' } }}
			>
				<Flex justify="space-between" align="center" wrap="wrap" gap={12}>
					<Space size={12}>
						<div
							style={{
								width: 40,
								height: 40,
								borderRadius: '50%',
								backgroundColor: token.colorPrimary,
								color: '#fff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 20,
							}}
						>
							<RocketOutlined />
						</div>
						<div>
							<Text strong style={{ fontSize: 14, display: 'block' }}>
								Tóm tắt công việc (Job Overview)
							</Text>
							<Space size={8} wrap style={{ marginTop: 2 }}>
								<Tag color="blue">
									{crawlMode === 'account_with_videos'
										? `Tài khoản + Video (${maxVideos} video/kênh)`
										: crawlMode === 'account_only'
											? 'Chỉ thông tin tài khoản'
											: 'Chỉ URLs Video'}
								</Tag>
								<Tag color="geekblue">
									Nguồn:{' '}
									{sourceType === 'usernames'
										? 'Danh sách Username'
										: sourceType === 'urls'
											? 'Danh sách URLs'
											: sourceType === 'database'
												? 'Tài khoản DB'
												: 'Lấy mẫu ngẫu nhiên'}
								</Tag>
								<Tag color={targetCount > 0 ? 'green' : 'default'}>
									Mục tiêu: {formatNumber(targetCount)}{' '}
									{crawlMode === 'video_only' ? 'video' : 'tài khoản'}
								</Tag>
								{crawlMode === 'account_with_videos' && targetCount > 0 && (
									<Tag color="purple">Ước tính tải: tối đa ~{formatNumber(estimatedVideos)} video</Tag>
								)}
							</Space>
						</div>
					</Space>

					<Tag color="gold" style={{ fontSize: 12, padding: '4px 10px' }}>
						Trạng thái khởi tạo: Chờ xử lý (Pending)
					</Tag>
				</Flex>
			</Card>
		</Space>
	);
}

/**
 * Unified form page for both Creating and Editing Crawl Jobs
 * using Core's shared ResourceForm component.
 */
export default function CrawlJobFormPage() {
	return (
		<ResourceForm
			resourceName="Crawl Job"
			backUrl="/crawler/crawl-job"
			submitText="Khởi tạo Crawl Job"
			fetchRecord={async (id) => {
				const res = await crawlJobAPI.getCrawlJobByID(id);
				return res?.data ?? res;
			}}
			transformInitialValues={(jobData) => {
				const values = Array.isArray(jobData.data_crawl) ? jobData.data_crawl : [];
				return {
					crawl_mode: jobData.crawl_mode ?? 'account_with_videos',
					max_videos_per_account: jobData.max_videos_per_account ?? 20,
					source_type: jobData.source_type,
					usernames: jobData.source_type === 'usernames' ? values.join('\n') : undefined,
					urls: jobData.source_type === 'urls' ? values.join('\n') : undefined,
					account_ids: jobData.source_type === 'database' ? values : [],
					total_accounts: jobData.source_type === 'count' ? values[0] : undefined,
				};
			}}
			initialValues={{
				crawl_mode: 'account_with_videos',
				max_videos_per_account: 20,
				source_type: 'usernames',
				account_ids: [],
			}}
			onCreate={async (values) => {
				let dataCrawl: any[] = [];
				if (values.source_type === 'usernames') {
					dataCrawl = extractCleanUsernames(values.usernames);
				} else if (values.source_type === 'urls') {
					dataCrawl = extractCleanUrls(values.urls);
				} else if (values.source_type === 'database') {
					dataCrawl = values.account_ids ?? [];
				} else if (values.source_type === 'count') {
					dataCrawl = values.total_accounts ? [Number(values.total_accounts)] : [];
				}

				if (dataCrawl.length === 0) {
					throw new Error('Vui lòng cung cấp ít nhất một mục tiêu crawl hợp lệ.');
				}

				const crawlMode = values.crawl_mode ?? 'account_with_videos';
				const result = await crawlJobAPI.createCrawlJob({
					source_type: values.source_type,
					crawl_mode: crawlMode,
					max_videos_per_account:
						crawlMode === 'account_only' ? 0 : Number(values.max_videos_per_account ?? 20),
					data_crawl: dataCrawl,
				});
				return result?.data ?? result;
			}}
			onUpdate={async (id, values) => {
				let dataCrawl: any[] = [];
				if (values.source_type === 'usernames') {
					dataCrawl = extractCleanUsernames(values.usernames);
				} else if (values.source_type === 'urls') {
					dataCrawl = extractCleanUrls(values.urls);
				} else if (values.source_type === 'database') {
					dataCrawl = values.account_ids ?? [];
				} else if (values.source_type === 'count') {
					dataCrawl = values.total_accounts ? [Number(values.total_accounts)] : [];
				}

				if (dataCrawl.length === 0) {
					throw new Error('Vui lòng cung cấp ít nhất một mục tiêu crawl hợp lệ.');
				}

				const crawlMode = values.crawl_mode ?? 'account_with_videos';
				return await crawlJobAPI.updateCrawlJob(id, {
					source_type: values.source_type,
					crawl_mode: crawlMode,
					max_videos_per_account:
						crawlMode === 'account_only' ? 0 : Number(values.max_videos_per_account ?? 20),
					data_crawl: dataCrawl,
				});
			}}
			redirectUrl={(result, isEdit, id) => {
				if (isEdit) return `/crawler/crawl-job/${id}`;
				return `/crawler/crawl-job`;
			}}
		>
			{(ctx) => <CrawlJobFormFields {...ctx} />}
		</ResourceForm>
	);
}
