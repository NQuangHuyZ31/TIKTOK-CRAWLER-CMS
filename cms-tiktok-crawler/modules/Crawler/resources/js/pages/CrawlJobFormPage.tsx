import React from 'react';
import crawlJobAPI from '@modules/Crawler/resources/js/Action/crawlJob';
import ResourceForm from '@core/components/ResourceForm';
import { extractCleanUrls, extractCleanUsernames } from '../utils/crawlerHelpers';
import CrawlJobFormFields from '../components/form/CrawlJobFormFields';

export { extractCleanUrls, extractCleanUsernames };

function parseDataCrawl(values: any): any[] {
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
		throw new Error('Please provide at least one valid crawl target.');
	}
	return dataCrawl;
}

function parseDateFilter(targetDateRaw?: string | null): { targetDate: string | null; dateFrom: string | null; dateTo: string | null } {
	if (!targetDateRaw || targetDateRaw === 'all') {
		return { targetDate: null, dateFrom: null, dateTo: null };
	}
	if (typeof targetDateRaw === 'string' && targetDateRaw.startsWith('range:')) {
		const parts = targetDateRaw.split(':');
		return {
			targetDate: null,
			dateFrom: parts[1] || null,
			dateTo: parts[2] || null,
		};
	}
	return { targetDate: targetDateRaw, dateFrom: null, dateTo: null };
}

export default function CrawlJobFormPage() {
	return (
		<ResourceForm
			resourceName="Crawl Job"
			backUrl="/crawler/crawl-job"
			submitText="Create Crawl Job"
			fetchRecord={async (id) => {
				const res = await crawlJobAPI.getCrawlJobByID(id);
				return res?.data ?? res;
			}}
			transformInitialValues={(jobData) => {
				const values = Array.isArray(jobData.data_crawl) ? jobData.data_crawl : [];
				let initialTargetDate = jobData.target_date ?? 'all';
				if (jobData.date_from && jobData.date_to) {
					initialTargetDate = `range:${jobData.date_from}:${jobData.date_to}`;
				}
				return {
					crawl_mode: jobData.crawl_mode ?? 'account_with_videos',
					max_videos_per_account: jobData.max_videos_per_account ?? 20,
					target_date: initialTargetDate,
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
				target_date: 'all',
				source_type: 'usernames',
				account_ids: [],
			}}
			onCreate={async (values) => {
				const dataCrawl = parseDataCrawl(values);
				const crawlMode = values.crawl_mode ?? 'account_with_videos';
				const { targetDate, dateFrom, dateTo } = parseDateFilter(values.target_date);
				const result = await crawlJobAPI.createCrawlJob({
					source_type: values.source_type,
					crawl_mode: crawlMode,
					max_videos_per_account: crawlMode === 'account_only' ? 0 : Number(values.max_videos_per_account ?? 20),
					target_date: targetDate,
					date_from: dateFrom,
					date_to: dateTo,
					data_crawl: dataCrawl,
				});
				return result?.data ?? result;
			}}
			onUpdate={async (id, values) => {
				const dataCrawl = parseDataCrawl(values);
				const crawlMode = values.crawl_mode ?? 'account_with_videos';
				const { targetDate, dateFrom, dateTo } = parseDateFilter(values.target_date);
				return await crawlJobAPI.updateCrawlJob(id, {
					source_type: values.source_type,
					crawl_mode: crawlMode,
					max_videos_per_account: crawlMode === 'account_only' ? 0 : Number(values.max_videos_per_account ?? 20),
					target_date: targetDate,
					date_from: dateFrom,
					date_to: dateTo,
					data_crawl: dataCrawl,
				});
			}}
			redirectUrl={(_result, isEdit, id) => (isEdit ? `/crawler/crawl-job/${id}` : `/crawler/crawl-job`)}
		>
			{(ctx) => <CrawlJobFormFields {...ctx} />}
		</ResourceForm>
	);
}
