<?php

namespace Modules\API\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CrawlerResultStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event' => ['required', Rule::in(['started', 'account', 'completed', 'paused'])],
            'job_id' => ['required', 'integer', 'exists:crawl_jobs,id'],
            'status' => ['required', Rule::in(['running', 'queued', 'success', 'failed', 'completed'])],
            'worker_id' => ['nullable', 'string', 'max:64'],
            'resumed' => ['nullable', 'boolean'],
            'account' => ['nullable', 'array'],
            'account.username' => ['nullable', 'string', 'max:255'],
            'account.sec_uid' => ['nullable', 'string', 'max:255'],
            'account.nickname' => ['nullable', 'string', 'max:255'],
            'account.bio' => ['nullable', 'string'],
            'account.is_verified' => ['nullable', 'boolean'],
            'account.followers' => ['nullable', 'integer', 'min:0'],
            'account.following' => ['nullable', 'integer', 'min:0'],
            'account.likes' => ['nullable', 'integer', 'min:0'],
            'account.video_count' => ['nullable', 'integer', 'min:0'],
            'account.profile_url' => ['nullable', 'string', 'max:10000'],
            'account.avatar_url' => ['nullable', 'string', 'max:10000'],
            'account.avatar_path' => ['nullable', 'string', 'max:255'],
            'account.status' => ['nullable', Rule::in(['active', 'inactive'])],
            'account.crawled_at' => ['nullable', 'date'],
            'account.last_crawled_at' => ['nullable', 'date'],
            'account.avatar' => ['nullable', 'array'],
            'account.avatar.content_base64' => ['required_with:account.avatar', 'string'],
            'account.avatar.mime' => ['nullable', 'string', 'max:64'],
            'account.videos' => ['nullable', 'array'],
            'videos' => ['nullable', 'array'],
            'videos.*.video_id' => ['required_with:videos', 'string', 'max:64'],
            'videos.*.video_url' => ['nullable', 'string', 'max:1000'],
            'videos.*.description' => ['nullable', 'string'],
            'videos.*.hashtags' => ['nullable', 'array'],
            'videos.*.duration' => ['nullable', 'integer', 'min:0'],
            'videos.*.width' => ['nullable', 'integer', 'min:0'],
            'videos.*.height' => ['nullable', 'integer', 'min:0'],
            'videos.*.definition' => ['nullable', 'string', 'max:32'],
            'videos.*.cover_url' => ['nullable', 'string', 'max:10000'],
            'videos.*.dynamic_cover_url' => ['nullable', 'string', 'max:10000'],
            'videos.*.music_id' => ['nullable', 'string', 'max:64'],
            'videos.*.music_title' => ['nullable', 'string', 'max:255'],
            'videos.*.music_author' => ['nullable', 'string', 'max:255'],
            'videos.*.is_original_sound' => ['nullable', 'boolean'],
            'videos.*.is_pinned' => ['nullable', 'boolean'],
            'videos.*.is_ad' => ['nullable', 'boolean'],
            'videos.*.play_count' => ['nullable', 'integer', 'min:0'],
            'videos.*.digg_count' => ['nullable', 'integer', 'min:0'],
            'videos.*.comment_count' => ['nullable', 'integer', 'min:0'],
            'videos.*.share_count' => ['nullable', 'integer', 'min:0'],
            'videos.*.collect_count' => ['nullable', 'integer', 'min:0'],
            'videos.*.published_at' => ['nullable', 'date'],
            'videos.*.crawled_at' => ['nullable', 'date'],
            'videos.*.status' => ['nullable', 'string', 'max:32'],
            'avatar' => ['nullable', 'array'],
            'avatar.content_base64' => ['required_with:avatar', 'string'],
            'avatar.mime' => ['nullable', 'string', 'max:64'],
            'username' => ['nullable', 'string', 'max:255'],
            'profile_url' => ['nullable', 'string', 'max:10000'],
            'error_code' => ['nullable', 'string', 'max:32'],
            'error_message' => ['nullable', 'string'],
            'total_accounts' => ['required_if:event,completed', 'integer', 'min:0'],
            'success_count' => ['required_if:event,completed', 'integer', 'min:0'],
            'failed_count' => ['required_if:event,completed', 'integer', 'min:0'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $event = $this->input('event');
                $status = $this->input('status');

                if ($event === 'started' && $status !== 'running') {
                    $validator->errors()->add(
                        'status',
                        'Started events must have running status.'
                    );
                }

                if ($event === 'account' && !in_array($status, ['success', 'failed'], true)) {
                    $validator->errors()->add(
                        'status',
                        'Account events must have success or failed status.'
                    );
                }

                if ($event === 'account' && $status === 'success' && !$this->input('account.username') && !$this->input('username')) {
                    $validator->errors()->add(
                        'account.username',
                        'A successful account event requires account.username.'
                    );
                }

                if ($event === 'account' && $status === 'failed' && !$this->input('username')) {
                    $validator->errors()->add(
                        'username',
                        'A failed account event requires username.'
                    );
                }

                if ($event === 'completed' && !in_array($status, ['completed', 'failed'], true)) {
                    $validator->errors()->add(
                        'status',
                        'Completed events must have completed or failed status.'
                    );
                }

                if ($event === 'paused' && !in_array($status, ['running', 'queued'], true)) {
                    $validator->errors()->add(
                        'status',
                        'Paused events must preserve running or queued status.'
                    );
                }
            },
        ];
    }
}
