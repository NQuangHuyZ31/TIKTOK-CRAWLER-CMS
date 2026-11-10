import React, { useState } from 'react';
import { Space, Typography } from 'antd';
import { DislikeFilled, DislikeOutlined, LikeFilled, LikeOutlined } from '@ant-design/icons';
import { useDocLanguage } from '../../context/DocLanguageContext';

const { Text } = Typography;

export default function FeedbackWidget() {
	const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);
	const { t } = useDocLanguage();

	return (
		<div style={{ margin: '36px 0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
			<Text type="secondary" style={{ fontSize: 13 }}>
				{t('feedback.question', 'Was this article helpful?', 'Bài viết này có hữu ích không?')}
			</Text>
			<Space size={12}>
				<button
					type="button"
					onClick={() => setFeedback('liked')}
					style={{
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						fontSize: 20,
						color: feedback === 'liked' ? '#1677ff' : '#8c8c8c',
						padding: 4,
						display: 'flex',
						alignItems: 'center',
						transition: 'transform 0.1s',
					}}
					title={t('feedback.helpful', 'Helpful', 'Hữu ích')}
				>
					{feedback === 'liked' ? <LikeFilled /> : <LikeOutlined />}
				</button>

				<button
					type="button"
					onClick={() => setFeedback('disliked')}
					style={{
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						fontSize: 20,
						color: feedback === 'disliked' ? '#ff4d4f' : '#8c8c8c',
						padding: 4,
						display: 'flex',
						alignItems: 'center',
						transition: 'transform 0.1s',
					}}
					title={t('feedback.notHelpful', 'Not helpful', 'Không hữu ích')}
				>
					{feedback === 'disliked' ? <DislikeFilled /> : <DislikeOutlined />}
				</button>

				{feedback && (
					<Text style={{ fontSize: 12, color: '#52c41a', marginLeft: 8 }}>
						{t('feedback.thanks', 'Thank you for your feedback!', 'Cảm ơn bạn đã đóng góp ý kiến!')}
					</Text>
				)}
			</Space>
		</div>
	);
}
