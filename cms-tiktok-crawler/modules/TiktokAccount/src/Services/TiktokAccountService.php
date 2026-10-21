<?php

namespace Modules\TiktokAccount\Services;

use Modules\Core\Utils\CheckFileUpload;
use Modules\Core\Utils\UploadFile;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class TiktokAccountService
{
    private const ACCOUNT_STATUSES = ['active', 'inactive'];

    public function __construct(protected TiktokAccountRepositoryInterface $tiktokAccountRepository)
    {
    }

    /**
     * Complex Business Logic: Update account profile with avatar file handling.
     * Validates avatar image file, stores to disk, deletes old avatar, updates account.
     */
    public function update(int $id, array $data): TiktokAccount
    {
        if (isset($data['status']) && !in_array($data['status'], self::ACCOUNT_STATUSES, true)) {
            throw new \InvalidArgumentException('Status must be active or inactive.');
        }

        $account = $this->tiktokAccountRepository->findById($id);
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
            throw new \InvalidArgumentException('Status must be active or inactive.');
        }

        return $this->tiktokAccountRepository->updateStatus($id, $status);
    }
}