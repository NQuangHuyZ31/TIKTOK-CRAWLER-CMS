import dayjs from 'dayjs';
import { TIKTOK_ACCOUNT_STATUS_FILTER_OPTIONS } from './accountOptions';
import { FOLLOWER_PRESETS, FOLLOWING_PRESETS, LIKE_PRESETS } from './filterPresets';

export function buildAccountFilters(
	params: Record<string, any>,
	onParamChange: (key: string, value: any) => void
) {
	return [
		{
			key: 'status',
			placeholder: 'All statuses',
			options: TIKTOK_ACCOUNT_STATUS_FILTER_OPTIONS,
			initialValue: params.status,
			onChange: (val: any) => onParamChange('status', val),
		},
		{
			key: 'followers_count',
			placeholder: 'Followers',
			type: 'numberRange' as const,
			presets: FOLLOWER_PRESETS,
			initialValue: params.followers_count,
			onChange: (val: any) => onParamChange('followers_count', val),
		},
		{
			key: 'following_count',
			placeholder: 'Following',
			type: 'numberRange' as const,
			presets: FOLLOWING_PRESETS,
			initialValue: params.following_count,
			onChange: (val: any) => onParamChange('following_count', val),
		},
		{
			key: 'likes_count',
			placeholder: 'Likes',
			type: 'numberRange' as const,
			presets: LIKE_PRESETS,
			initialValue: params.likes_count,
			onChange: (val: any) => onParamChange('likes_count', val),
		},
		{
			key: 'crawled_at',
			placeholder: 'Crawled at',
			type: 'date' as const,
			initialValue: params.crawled_at ? dayjs(params.crawled_at) : undefined,
			onChange: (val: any) =>
				onParamChange(
					'crawled_at',
					val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined
				),
		},
	];
}
