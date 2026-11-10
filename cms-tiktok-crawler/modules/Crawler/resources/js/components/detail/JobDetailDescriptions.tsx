import React from 'react';
import { Card, Descriptions, Tag } from 'antd';
import StatusTag from '@core/components/StatusTag';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';

interface JobDetailDescriptionsProps {
	job: any;
}

export default function JobDetailDescriptions({ job }: JobDetailDescriptionsProps) {
	const createdByDisplay = job?.creator?.name || job?.created_by_name || '-';
	const startedByDisplay = job?.starter?.name || job?.started_by_name || '-';

	return (
		<Card>
			<Descriptions bordered column={{ xs: 1, sm: 2, lg: 4 }}>
				<Descriptions.Item label="Status">
					<StatusTag status={job?.status} />
				</Descriptions.Item>
				<Descriptions.Item label="Crawl Mode">
					<Tag color={job?.crawl_mode === 'account_only' ? 'default' : 'purple'}>
						{job?.crawl_mode === 'account_only'
							? 'Account Only'
							: job?.crawl_mode === 'video_only'
								? 'Video URLs Only'
								: `Account + Videos (Max ${job?.max_videos_per_account ?? 20}${job?.target_date ? ` · Date: ${job.target_date}` : ''})`}
					</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="Total Accounts">
					{formatNumber(job?.total_accounts ?? job?.total_account ?? 0)}
				</Descriptions.Item>
				<Descriptions.Item label="Success">
					{formatNumber(job?.success_count ?? 0)}
				</Descriptions.Item>
				<Descriptions.Item label="Failed">
					{formatNumber(job?.failed_count ?? 0)}
				</Descriptions.Item>
				<Descriptions.Item label="Videos Crawled">
					{formatNumber(job?.total_videos_crawled ?? 0)}
				</Descriptions.Item>
				<Descriptions.Item label="Created By">
					{createdByDisplay}
				</Descriptions.Item>
				<Descriptions.Item label="Started By">
					{startedByDisplay}
				</Descriptions.Item>
				<Descriptions.Item label="Duration">
					{job?.duration ? `${job?.duration}s` : '-'}
				</Descriptions.Item>
				<Descriptions.Item label="Started At">
					{formatDateTime(job?.started_at) || '-'}
				</Descriptions.Item>
				<Descriptions.Item label="Finished At">
					{formatDateTime(job?.finished_at) || '-'}
				</Descriptions.Item>
				<Descriptions.Item label="Error Message" span={1}>
					{job?.error_message || '-'}
				</Descriptions.Item>
			</Descriptions>
		</Card>
	);
}
