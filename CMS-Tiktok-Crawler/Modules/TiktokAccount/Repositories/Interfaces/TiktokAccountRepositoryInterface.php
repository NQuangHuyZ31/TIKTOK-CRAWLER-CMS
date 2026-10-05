<?php

namespace Modules\TiktokAccount\Repositories\Interfaces;

interface TiktokAccountRepositoryInterface
{
    public function getAll();

    public function getAllWithoutPagination();

    public function updateOrCreateAccount(array $attributes, array $values);
}
