<?php

namespace Modules\TiktokAccount\Services;

use Modules\Core\Utils\CheckFileUpload;
use Modules\Core\Utils\UploadFile;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokVideoRepositoryInterface;

class TiktokAccountService
{
    private const ACCOUNT_STATUSES = ['active', 'inactive', 'banned'];

    public function __construct(
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        protected TiktokVideoRepositoryInterface $tiktokVideoRepository
    ) {
    }

    /**
     * Create a new TikTok account with optional avatar upload and default values.
     */
    public function create(array $data): TiktokAccount
    {
        if (isset($data['status']) && !in_array($data['status'], self::ACCOUNT_STATUSES, true)) {
            throw new \InvalidArgumentException('Status must be active, inactive, or banned.');
        }

        if (empty($data['status'])) {
            $data['status'] = 'active';
        }

        if (empty($data['profile_url']) && !empty($data['username'])) {
            $cleanUsername = ltrim($data['username'], '@');
            $data['profile_url'] = "https://www.tiktok.com/@{$cleanUsername}";
        }

        if (isset($data['avatar'])) {
            if (!CheckFileUpload::checkImageFile($data['avatar'])) {
                throw new \InvalidArgumentException('Invalid avatar file. Please upload a valid image file.');
            }

            $newAvatarPath = UploadFile::uploadFile($data['avatar'], 'tiktok-accounts/avatars');
            if (!$newAvatarPath) {
                throw new \RuntimeException('Failed to upload avatar.');
            }

            $data['avatar_path'] = $newAvatarPath;
            unset($data['avatar']);
        }

        /** @var TiktokAccount $account */
        $account = $this->tiktokAccountRepository->create($data);
        return $account;
    }

    /**
     * Update account profile with optional avatar file replacement and cleanup.
     */
    public function update(int $id, array $data): TiktokAccount
    {
        if (isset($data['status']) && !in_array($data['status'], self::ACCOUNT_STATUSES, true)) {
            throw new \InvalidArgumentException('Status must be active, inactive, or banned.');
        }

        $account = $this->tiktokAccountRepository->findById($id);
        if (!$account) {
            throw new \InvalidArgumentException('TikTok account not found.');
        }

        if (empty($data['profile_url']) && !empty($data['username'])) {
            $cleanUsername = ltrim($data['username'], '@');
            $data['profile_url'] = "https://www.tiktok.com/@{$cleanUsername}";
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

            // Do not pass raw UploadedFile to model update
            unset($data['avatar']);
        }

        $this->tiktokAccountRepository->update($id, $data);
        return $account->fresh();
    }

    /**
     * Update account status with business validation.
     */
    public function updateStatus(int $id, string $status): ?TiktokAccount
    {
        if (!in_array($status, self::ACCOUNT_STATUSES, true)) {
            throw new \InvalidArgumentException('Status must be active, inactive, or banned.');
        }

        return $this->tiktokAccountRepository->updateStatus($id, $status);
    }

    /**
     * Retrieve paginated crawl history results for an account.
     */
    public function getCrawlResults(int $id, int $perPage = 10, array $filters = []): mixed
    {
        return $this->tiktokAccountRepository->getCrawlResults($id, $perPage, $filters);
    }

    /**
     * Retrieve paginated TikTok videos for an account.
     */
    public function getVideos(int $id, int $perPage = 10, array $filters = []): mixed
    {
        $account = $this->tiktokAccountRepository->findById($id);
        if (!$account) {
            return null;
        }

        return $this->tiktokVideoRepository->getByAccountId($id, $perPage, $filters);
    }

    /**
     * Aggregate statistics summary for TikTok account metrics.
     */
    public function getStatisticSummary(): array
    {
        return $this->tiktokAccountRepository->getStatisticSummary();
    }
}