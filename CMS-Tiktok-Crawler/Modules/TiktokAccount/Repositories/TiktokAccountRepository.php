<?php

namespace Modules\TiktokAccount\Repositories;

use Modules\TiktokAccount\Models\TiktokAccount;

class TiktokAccountRepository {

	public function getAll() {
		return TiktokAccount::paginate(10);
	}
}