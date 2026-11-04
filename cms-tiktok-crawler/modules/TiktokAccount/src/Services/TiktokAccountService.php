<?php

namespace Modules\TiktokAccount\Services;

use Modules\Core\Services\StorageService;
use Modules\Core\Utils\CheckFileUpload;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokVideoRepositoryInterface;

class TiktokAccountService
{
    private const ACCOUNT_STATUSES = ['active', 'inactive', 'banned'];

    public function __construct(
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        protected TiktokVideoRepositoryInterface $tiktokVideoRepository,
        protected StorageService $storageService
    ) {}

    /**
     * Create a new TikTok account with optional avatar upload and default values.
     */
    public function create(array $data): TiktokAccount
    {
        $this->validateStatus($data['status'] ?? null);
        $data['status'] = $data['status'] ?? 'active';
        $this->ensureProfileUrl($data);

        if (isset($data['avatar'])) {
            $data['avatar_path'] = $this->processAvatar($data['avatar']);
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
        $this->validateStatus($data['status'] ?? null);

        $account = $this->tiktokAccountRepository->findById($id);
        if (!$account) {
            throw new \InvalidArgumentException('TikTok account not found.');
        }

        $this->ensureProfileUrl($data);

        if (isset($data['avatar'])) {
            $data['avatar_path'] = $this->processAvatar($data['avatar'], $account->avatar_path);
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
        $this->validateStatus($status);

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

    /**
     * Validate account status against allowed enum values.
     */
    private function validateStatus(?string $status): void
    {
        if ($status !== null && !in_array($status, self::ACCOUNT_STATUSES, true)) {
            throw new \InvalidArgumentException('Status must be active, inactive, or banned.');
        }
    }

    /**
     * Ensure default TikTok profile URL is constructed if omitted.
     */
    private function ensureProfileUrl(array &$data): void
    {
        if (empty($data['profile_url']) && !empty($data['username'])) {
            $cleanUsername = ltrim($data['username'], '@');
            $data['profile_url'] = "https://www.tiktok.com/@{$cleanUsername}";
        }
    }

    /**
     * Validate and store uploaded avatar image file.
     */
    private function processAvatar(mixed $avatar, ?string $oldPath = null): string
    {
        if (!CheckFileUpload::checkImageFile($avatar)) {
            throw new \InvalidArgumentException('Invalid avatar file. Please upload a valid image file.');
        }

        $options = $oldPath ? ['delete_old' => true, 'old_path' => $oldPath] : [];

        return $this->storageService->storeUploadedFile(
            file: $avatar,
            destinationDir: 'tiktok-accounts/avatars',
            options: $options
        );
    }
}
