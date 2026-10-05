<?php

namespace Modules\APIs\Requests;

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
            'event' => ['required', Rule::in(['account', 'completed'])],
            'job_id' => ['required', 'integer', 'exists:crawl_jobs,id'],
            'status' => ['required', Rule::in(['success', 'failed', 'completed'])],
            'account' => ['nullable', 'array'],
            'account.username' => ['nullable', 'string', 'max:255'],
            'account.followers' => ['nullable', 'integer', 'min:0'],
            'account.following' => ['nullable', 'integer', 'min:0'],
            'account.likes' => ['nullable', 'integer', 'min:0'],
            // TikTok CDN URLs may contain signed query parameters.
            'account.profile_url' => ['nullable', 'string', 'max:10000'],
            'account.avatar_url' => ['nullable', 'string', 'max:10000'],
            'account.avatar_path' => ['nullable', 'string', 'max:255'],
            'account.status' => ['nullable', Rule::in(['active', 'inactive'])],
            'account.crawled_at' => ['nullable', 'date'],
            'account.last_crawled_at' => ['nullable', 'date'],
            'username' => ['nullable', 'string', 'max:255'],
            'profile_url' => ['nullable', 'string', 'max:10000'],
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

                if ($event === 'account' && !in_array($status, ['success', 'failed'], true)) {
                    $validator->errors()->add(
                        'status',
                        'Account events must have success or failed status.'
                    );
                }

                if ($event === 'account' && $status === 'success' && !$this->input('account.username')) {
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
            },
        ];
    }
}
