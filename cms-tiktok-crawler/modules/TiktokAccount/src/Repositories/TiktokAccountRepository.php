<?php

namespace Modules\TiktokAccount\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\BaseRepository;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class TiktokAccountRepository extends BaseRepository implements TiktokAccountRepositoryInterface
{
	protected function getModel(): Model
	{
		return new TiktokAccount();
	}

	/**
	 * Retrieve aggregate KPI dashboard statistics for TikTok accounts.
	 */
	public function getStatisticSummary(): array
	{
		return [
			'total_accounts' => TiktokAccount::count(),
			'total_followers' => (int) TiktokAccount::sum('followers_count'),
			'total_following' => (int) TiktokAccount::sum('following_count'),
			'total_likes' => (int) TiktokAccount::sum('likes_count'),
			'total_active_accounts' => TiktokAccount::where('status', 'active')->count(),
			'total_inactive_accounts' => TiktokAccount::where('status', 'inactive')->count(),
		];
	}

	/**
	 * Retrieve paginated crawl results for a specific TikTok account.
	 */
	public function getCrawlResults(int $accountId, int $perPage = 10, array $params = []): LengthAwarePaginator|false
	{
		$account = $this->findById($accountId);
		if (!$account) {
			return false;
		}

		$query = $account->crawlResults();

		if (!empty($params['username'])) {
			$query->where('username', 'like', '%' . $params['username'] . '%');
		}

		if (!empty($params['status'])) {
			$query->where('status', $params['status']);
		}

		return $query->paginate($perPage);
	}

	public function getUsernamesByIds(array $ids): array
	{
		return TiktokAccount::query()
			->whereIn('id', $ids)
			->pluck('username')
			->values()
			->all();
	}

	public function updateStatus(int $id, string $status): ?TiktokAccount
	{
		$account = $this->findById($id);
		if (!$account) {
			return null;
		}

		$account->update(['status' => $status]);
		return $account->fresh();
	}

	public function getAccountByField(string $field, string $value, ?int $excludeId = null): ?TiktokAccount
	{
		$query = TiktokAccount::query()->where($field, $value);
		if (!empty($excludeId)) {
			$query->where('id', '!=', $excludeId);
		}
		return $query->first();
	}

	public function updateOrCreateAccount(array $attributes, array $values): TiktokAccount
	{
		return TiktokAccount::updateOrCreate($attributes, $values);
	}
}
