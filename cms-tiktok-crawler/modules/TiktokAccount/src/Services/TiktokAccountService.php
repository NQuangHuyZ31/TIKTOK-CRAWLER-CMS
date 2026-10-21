<?php

namespace Modules\TiktokAccount\Services;

use Modules\Core\Utils\CheckFileUpload;
use Modules\Core\Utils\UploadFile;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class TiktokAccountService {
    private const ACCOUNT_STATUSES = ['active', 'inactive'];

    public function __construct(protected TiktokAccountRepositoryInterface $tiktokAccountRepository) {
    }

    // get all tiktok accounts
    public function getAll(array $requests) {
        return $this->tiktokAccountRepository->getAll($requests);
    }

    // get account by ID
    public function getDetails(int $id) {
        $account = $this->tiktokAccountRepository->getTiktokAccountById($id);

        if (!$account) {
            return false;
        }

        return $account;
    }

    // update account by ID
    public function update(int $id, array $data) {
        if (isset($data['status']) && !in_array($data['status'], self::ACCOUNT_STATUSES, true)) {
            throw new \InvalidArgumentException('Status must be active or inactive.');
        }

        $account = $this->tiktokAccountRepository->getTiktokAccountById($id);

        if (!$account) {
            throw new \InvalidArgumentException('TikTok account not found.');
        }

        if (isset($data['avatar'])) {
            if (!CheckFileUpload::checkImageFile($data['avatar'])) {
                throw new \InvalidArgumentException('Invalid avatar file. Please upload a valid image file.');
            }

            $newAvatarPath = UploadFile::uploadFile($data['avatar'], 'tiktok-accounts/avatars');

            if (!$newAvatarPath) {
                throw new \RuntimeException('Failed to upload avatar.');
            }

            if ($account->avatar_path) {
                UploadFile::deleteFile($account->avatar_path);
            }

            $data['avatar_path'] = $newAvatarPath;

            // Do not pass UploadedFile down to repository
            unset($data['avatar']);
        }

        return $this->tiktokAccountRepository->updateOrCreateAccount(['id' => $id], $data);
    }

    // delete account by ID
    public function delete(int $id) {
        return $this->tiktokAccountRepository->deleteAccountById($id);
    }

    public function updateStatus(int $id, string $status) {
        if (!in_array($status, self::ACCOUNT_STATUSES, true)) {
            throw new \InvalidArgumentException('Status must be active or inactive.');
        }

        return $this->tiktokAccountRepository->updateAccountStatus($id, $status);
    }

    // get crawl results by account ID
    public function getCrawlResults(int $accountId, $per_page, array $params = []) {
        return $this->tiktokAccountRepository->getCrawlResults($accountId, $per_page, $params);
    }

    // get statistic summary
    public function getStatisticSummary() {
        return $this->tiktokAccountRepository->getStatisticSummary();
    }
}