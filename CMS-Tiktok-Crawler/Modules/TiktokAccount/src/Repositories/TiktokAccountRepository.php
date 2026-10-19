<?php

namespace Modules\TiktokAccount\Repositories;

use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class TiktokAccountRepository implements TiktokAccountRepositoryInterface {

	public function getAll(array $requests) {
		$query = TiktokAccount::query();

		if (isset($requests['pagination']) && $requests['pagination'] === 'false') {
			return $query->get();
		}

		if(isset($requests['username']) && !empty($requests['username'])) {
			$query->where('username', 'like', '%' . $requests['username'] . '%');
		}

		return $query->paginate($requests['per_page'] ?? 5);
	}

	public function getAccountByField(string $field, string $value, int $id = null) {
		$query = TiktokAccount::query()
			->where($field, $value);

		if (!empty($id)){
			$query->where('id', $id);
		}

		return $query->first();
	}

	public function getTiktokAccountById(int $id) {
		return TiktokAccount::find($id);
	}

	public function updateOrCreateAccount(array $attributes, array $values) {
		return TiktokAccount::updateOrCreate($attributes, $values);
	}

	public function getUsernamesByIds(array $ids): array {
		return TiktokAccount::query()
			->whereIn('id', $ids)
			->pluck('username')
			->values()
			->all();
	}

	public function deleteAccountById(int $id): bool {
		$account = TiktokAccount::find($id);

		if ($account) {
			return $account->delete();
		}
		
		return false;
	}

	public function updateAccountStatus(int $id, string $status) {
		$account = TiktokAccount::find($id);

		if (!$account) {
			return false;
		}

		$account->update(['status' => $status]);

		return $account->fresh();
	}

	public function getCrawlResults(int $accountId, $per_page, array $params = []) {
		if (empty($accountId) || !$this->getTiktokAccountById($accountId)) {
			return false;
		}

		$query = $this->getTiktokAccountById($accountId)->crawlResults();

		if (isset($params['username'])) {
			$query->where('username', 'like', '%' . $params['username'] . '%');
		}

		return $query->paginate($per_page);
	}

	public function getStatisticSummary() {
		return [
			'total_accounts' => TiktokAccount::count(),
			'total_followers' => TiktokAccount::sum('followers_count'),
			'total_following' => TiktokAccount::sum('following_count'),
			'total_likes' => TiktokAccount::sum('likes_count'),
			'total_active_accounts' => TiktokAccount::where('status', 'active')->count(),
			'total_inactive_accounts' => TiktokAccount::where('status', 'inactive')->count(),
		];
	}
}