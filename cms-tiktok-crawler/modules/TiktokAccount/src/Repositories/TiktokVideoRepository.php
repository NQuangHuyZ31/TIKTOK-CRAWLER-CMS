<?php

namespace Modules\TiktokAccount\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\BaseRepository;
use Modules\TiktokAccount\Models\TiktokVideo;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokVideoRepositoryInterface;

class TiktokVideoRepository extends BaseRepository implements TiktokVideoRepositoryInterface
{
    protected array $searchableColumns = ['video_id', 'username', 'description', 'music_title'];
    protected array $filterableColumns = [
        'status',
        'tiktok_account_id',
        'username',
        'is_pinned',
        'play_count',
        'digg_count',
        'comment_count',
        'share_count',
        'collect_count',
        'published_at',
        'last_crawled_at',
    ];
    protected array $sortableColumns = [
        'id',
        'video_id',
        'play_count',
        'digg_count',
        'comment_count',
        'share_count',
        'collect_count',
        'duration',
        'published_at',
        'last_crawled_at',
        'created_at',
    ];
    protected array $defaultSort = ['published_at', 'desc'];

    protected function getModel(): Model
    {
        return new TiktokVideo();
    }

    public function getByAccountId(int $accountId, int $perPage = 10, array $params = []): LengthAwarePaginator
    {
        $request = new Request($params);
        $query = $this->model->newQuery()->where('tiktok_account_id', $accountId);

        $this->applySearch($query, $request);
        $this->applyFilters($query, $request);
        $this->applySorting($query, $request);

        return $query->paginate(min(max($perPage, 1), 100));
    }
}
