<?php

namespace Tests\Unit;

use Illuminate\Support\Carbon;
use Modules\Core\Utils\DateRangeHelper;
use Tests\TestCase;

class DateRangeHelperTest extends TestCase
{
    public function test_resolves_today(): void
    {
        [$from, $to] = DateRangeHelper::resolve('today');

        $this->assertSame(now()->startOfDay()->toDateTimeString(), $from);
        $this->assertSame(now()->endOfDay()->toDateTimeString(), $to);
    }

    public function test_resolves_yesterday(): void
    {
        [$from, $to] = DateRangeHelper::resolve('yesterday');

        $this->assertSame(now()->subDay()->startOfDay()->toDateTimeString(), $from);
        $this->assertSame(now()->subDay()->endOfDay()->toDateTimeString(), $to);
    }

    public function test_resolves_n_days_presets(): void
    {
        [$from7, $to7] = DateRangeHelper::resolve('7_days');
        $this->assertSame(now()->subDays(7)->startOfDay()->toDateTimeString(), $from7);
        $this->assertSame(now()->endOfDay()->toDateTimeString(), $to7);

        [$from30, $to30] = DateRangeHelper::resolve('30_days');
        $this->assertSame(now()->subDays(30)->startOfDay()->toDateTimeString(), $from30);
        $this->assertSame(now()->endOfDay()->toDateTimeString(), $to30);

        [$from90, $to90] = DateRangeHelper::resolve('90_days');
        $this->assertSame(now()->subDays(90)->startOfDay()->toDateTimeString(), $from90);
        $this->assertSame(now()->endOfDay()->toDateTimeString(), $to90);
    }

    public function test_resolves_specific_date(): void
    {
        [$from, $to] = DateRangeHelper::resolve('2026-11-10');

        $this->assertSame('2026-11-10 00:00:00', $from);
        $this->assertSame('2026-11-10 23:59:59', $to);
    }

    public function test_resolves_custom_date_bounds(): void
    {
        [$from, $to] = DateRangeHelper::resolve(null, '2026-11-01', '2026-11-09');

        $this->assertSame('2026-11-01 00:00:00', $from);
        $this->assertSame('2026-11-09 23:59:59', $to);
    }

    public function test_resolves_empty_target_date(): void
    {
        [$from, $to] = DateRangeHelper::resolve(null);

        $this->assertNull($from);
        $this->assertNull($to);
    }

    public function test_to_utc_iso_converts_correctly(): void
    {
        $localTime = '2026-11-16 00:00:00';
        $iso = DateRangeHelper::toUtcIso($localTime);

        $expectedIso = Carbon::parse($localTime)->toISOString();
        $this->assertSame($expectedIso, $iso);
        $this->assertNull(DateRangeHelper::toUtcIso(null));
    }
}
