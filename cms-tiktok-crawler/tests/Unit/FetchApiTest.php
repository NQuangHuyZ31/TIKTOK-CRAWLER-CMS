<?php

namespace Tests\Unit;

use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use Modules\Core\Utils\FetchApi;
use RuntimeException;
use Tests\TestCase;

class FetchApiTest extends TestCase
{
    public function test_get_request_sends_query_parameters_and_returns_json(): void
    {
        Http::fake([
            'https://api.example.com/items?page=1&limit=10' => Http::response([
                'items' => [['id' => 1, 'name' => 'Item 1']],
                'total' => 1,
            ], 200),
        ]);

        $result = FetchApi::get('https://api.example.com/items', ['page' => 1, 'limit' => 10]);

        $this->assertSame(1, $result['total']);
        $this->assertSame('Item 1', $result['items'][0]['name']);
    }

    public function test_post_request_sends_json_payload_and_bearer_token(): void
    {
        Http::fake([
            'https://api.example.com/tasks' => function (\Illuminate\Http\Client\Request $request) {
                if ($request->header('Authorization')[0] !== 'Bearer test-token') {
                    return Http::response(['message' => 'Unauthorized'], 401);
                }
                return Http::response([
                    'success' => true,
                    'data' => $request->data(),
                ], 201);
            },
        ]);

        $result = FetchApi::post(
            'https://api.example.com/tasks',
            ['title' => 'Test Task'],
            [],
            ['token' => 'test-token']
        );

        $this->assertTrue($result['success']);
        $this->assertSame('Test Task', $result['data']['title']);
    }

    public function test_put_patch_delete_shortcuts(): void
    {
        Http::fake([
            'https://api.example.com/items/1' => Http::response(['status' => 'updated'], 200),
            'https://api.example.com/items/2' => Http::response(['status' => 'patched'], 200),
            'https://api.example.com/items/3' => Http::response(['status' => 'deleted'], 200),
        ]);

        $put = FetchApi::put('https://api.example.com/items/1', ['name' => 'new']);
        $this->assertSame('updated', $put['status']);

        $patch = FetchApi::patch('https://api.example.com/items/2', ['status' => 'active']);
        $this->assertSame('patched', $patch['status']);

        $delete = FetchApi::delete('https://api.example.com/items/3');
        $this->assertSame('deleted', $delete['status']);
    }

    public function test_fetch_and_fetchapi_aliases_work(): void
    {
        Http::fake([
            'https://api.example.com/custom' => Http::response(['mode' => 'custom_ok'], 200),
        ]);

        $res1 = FetchApi::fetch('https://api.example.com/custom', 'POST', ['a' => 1]);
        $this->assertSame('custom_ok', $res1['mode']);

        $res2 = FetchApi::fetchAPI('https://api.example.com/custom', 'POST', ['a' => 1]);
        $this->assertSame('custom_ok', $res2['mode']);
    }

    public function test_invalid_url_and_method_throw_invalid_argument_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        FetchApi::get('not-a-valid-url');
    }

    public function test_unsupported_method_throws_invalid_argument_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        FetchApi::request('https://api.example.com', 'INVALID_METHOD');
    }

    public function test_failed_request_throws_runtime_exception(): void
    {
        Http::fake([
            'https://api.example.com/error' => Http::response(['error' => 'Internal Server Error'], 500),
        ]);

        $this->expectException(RuntimeException::class);
        FetchApi::get('https://api.example.com/error');
    }

    public function test_failed_request_does_not_throw_when_throw_option_is_false(): void
    {
        Http::fake([
            'https://api.example.com/error' => Http::response(['error' => 'Not Found'], 404),
        ]);

        $result = FetchApi::get('https://api.example.com/error', [], [], ['throw' => false]);
        $this->assertSame('Not Found', $result['error']);
    }
}
