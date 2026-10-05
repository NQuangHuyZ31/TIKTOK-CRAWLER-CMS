<?php

namespace Modules\TiktokAccount\Services;

use Modules\TiktokAccount\Repositories\TiktokAccountRepository;

class TiktokAccountService {

	public function __construct(protected TiktokAccountRepository $tiktokAccountRepository) 
	{
	}

	// get all tiktok accounts
	public function getAllTiktokAccountsNotpaginated() {
		return $this->tiktokAccountRepository->getAllWithoutPagination();
	}
}