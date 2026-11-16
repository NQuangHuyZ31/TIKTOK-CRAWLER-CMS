<?php

namespace Modules\Core\Utils;

use Illuminate\Support\Carbon;

class DateRangeHelper
{
    /**
     * Resolve effective [date_from, date_to] local datetime strings from target_date or custom bounds.
     *
     * @return array{0: ?string, 1: ?string}
     */
    public static function resolve(?string $targetDate, mixed $dateFrom = null, mixed $dateTo = null): array
    {
        $fromStr = !empty($dateFrom) ? (is_string($dateFrom) ? $dateFrom : $dateFrom->toDateTimeString()) : null;
        $toStr = !empty($dateTo) ? (is_string($dateTo) ? $dateTo : $dateTo->toDateTimeString()) : null;

        if ($targetDate && empty($fromStr) && empty($toStr)) {
            $td = strtolower(trim($targetDate));

            if ($td === 'today') {
                $fromStr = now()->startOfDay()->toDateTimeString();
                $toStr = now()->endOfDay()->toDateTimeString();
            } elseif ($td === 'yesterday') {
                $fromStr = now()->subDay()->startOfDay()->toDateTimeString();
                $toStr = now()->subDay()->endOfDay()->toDateTimeString();
            } elseif ($td === '7_days') {
                $fromStr = now()->subDays(7)->startOfDay()->toDateTimeString();
                $toStr = now()->endOfDay()->toDateTimeString();
            } elseif ($td === '30_days') {
                $fromStr = now()->subDays(30)->startOfDay()->toDateTimeString();
                $toStr = now()->endOfDay()->toDateTimeString();
            } elseif ($td === '90_days') {
                $fromStr = now()->subDays(90)->startOfDay()->toDateTimeString();
                $toStr = now()->endOfDay()->toDateTimeString();
            } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $td)) {
                $parsed = Carbon::parse($td);
                $fromStr = $parsed->copy()->startOfDay()->toDateTimeString();
                $toStr = $parsed->copy()->endOfDay()->toDateTimeString();
            }
        } elseif (!empty($fromStr) || !empty($toStr)) {
            if (!empty($fromStr) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $fromStr)) {
                $fromStr = Carbon::parse($fromStr)->startOfDay()->toDateTimeString();
            }
            if (!empty($toStr) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $toStr)) {
                $toStr = Carbon::parse($toStr)->endOfDay()->toDateTimeString();
            }
        }

        return [$fromStr, $toStr];
    }

    /**
     * Convert local datetime string or Carbon instance to UTC ISO-8601 string.
     */
    public static function toUtcIso(mixed $date): ?string
    {
        if (empty($date)) {
            return null;
        }

        return Carbon::parse($date)->toISOString();
    }
}
