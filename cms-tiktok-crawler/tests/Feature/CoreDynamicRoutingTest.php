<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\User;
use Tests\TestCase;

class CoreDynamicRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $adminRole = \Modules\Role\Models\Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Admin', 'description' => 'Administrator']
        );
        $admin = \Modules\User\Models\User::firstOrCreate(
            ['email' => 'admin@cms.com'],
            ['name' => 'Admin', 'password' => bcrypt('password'), 'status' => 'active', 'is_admin' => true]
        );
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);
        $this->actingAs($admin);
    }

    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    public function test_dynamic_route_resolves_action_without_id_for_crawler(): void
    {
        $response = $this->getJson($this->apiUri('crawler/crawl-job/all'));

        $response->assertStatus(200);
        $response->assertJsonStructure(['data']);
    }

    public function test_dynamic_route_resolves_statistics_summary(): void
    {
        $response = $this->getJson($this->apiUri('crawler/crawl-job/statistics-summary'));

        $response->assertStatus(200);
        $response->assertJsonStructure(['data']);
    }

    public function test_dynamic_route_resolves_tiktok_account_all(): void
    {
        $response = $this->getJson($this->apiUri('tiktok-account/tiktok-account/all'));

        $response->assertStatus(200);
    }

    public function test_dynamic_route_resolves_tiktok_account_statistic_summary(): void
    {
        $response = $this->getJson($this->apiUri('tiktok-account/tiktok-account/statistic-summary'));

        $response->assertStatus(200);
    }

    public function test_dynamic_route_resolves_action_with_id(): void
    {
        $response = $this->getJson($this->apiUri('crawler/crawl-job/999999/details'));

        // Since ID 999999 doesn't exist, controller returns 404 JSON response
        $response->assertStatus(404);
        $response->assertJsonFragment(['message' => 'Resource not found.']);
    }

    public function test_dynamic_route_returns_404_for_unknown_controller(): void
    {
        $response = $this->getJson($this->apiUri('unknown/something/all'));

        $response->assertStatus(404);
    }

    public function test_dynamic_route_dispatches_post_creation_with_request_injection(): void
    {
        $response = $this->postJson($this->apiUri('crawler/crawl-job/add'), [
            'source_type' => 'usernames',
            'data_crawl' => ['tiktok_user_test'],
        ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['message' => 'Resource created successfully.']);
    }

    public function test_dynamic_route_dispatches_public_webhook(): void
    {
        $job = \Modules\Crawler\Models\CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['tiktok_user_webhook']),
            'total_accounts' => 1,
            'status' => 'running',
        ]);
        $jobId = $job->id;

        $response = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$jobId}/events"), [
            'job_id' => $jobId,
            'event' => 'completed',
            'status' => 'completed',
            'total_accounts' => 1,
            'success_count' => 1,
            'failed_count' => 0,
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Crawl job updated successfully.']);
    }

    public function test_dynamic_route_returns_404_for_unknown_action(): void
    {
        $response = $this->getJson($this->apiUri('crawler/crawl-job/thisActionDefinitelyDoesNotExist'));

        $response->assertStatus(404);
    }

    public function test_web_admin_route_serves_spa(): void
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $response = $this->get('/' . $adminPath);

        $response->assertStatus(200);
    }

    public function test_root_redirects_to_admin(): void
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $response = $this->get('/');

        $response->assertRedirect('/' . $adminPath . '/dashboard');
    }

    public function test_dynamic_route_resolver_unit_methods(): void
    {
        /** @var \Modules\Core\Support\DynamicRouteResovle $resolver */
        $resolver = app(\Modules\Core\Support\DynamicRouteResovle::class);

        $controllerClass = $resolver->resovleController('crawler', 'crawl-job');
        $this->assertEquals(\Modules\Crawler\Http\Controllers\CrawlJobController::class, $controllerClass);

        $tiktokControllerClass = $resolver->resovleController('tiktok-account', 'tiktok-account');
        $this->assertEquals(\Modules\TiktokAccount\Http\Controllers\TiktokAccountController::class, $tiktokControllerClass);

        $controllerInstance = app(\Modules\Crawler\Http\Controllers\CrawlJobController::class);
        $action = $resolver->resovleAction($controllerInstance, 'all', 'GET');
        $this->assertEquals('index', $action);

        $detailsAction = $resolver->resovleAction($controllerInstance, 'details', 'GET');
        $this->assertEquals('show', $detailsAction);
    }

    public function test_cors_headers_are_returned_for_admin_api_requests(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'GET',
        ])->getJson($this->apiUri('crawler/crawl-job/all'));

        $response->assertStatus(200);
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_cors_preflight_options_request_for_admin_api(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'X-Requested-With, Content-Type, Accept',
        ])->optionsJson($this->apiUri('crawler/crawl-job/all'));

        $response->assertStatus(204);
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        $response->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_core_controller_hierarchy_and_base_controller_inheritance(): void
    {
        $coreController = app(\Modules\Core\Http\Controllers\CoreController::class);

        $this->assertInstanceOf(\Modules\Core\Http\Controllers\BaseController::class, $coreController);
        $this->assertInstanceOf(\App\Http\Controllers\Controller::class, $coreController);
    }

    public function test_base_controller_ignores_search_filter_sort_when_not_declared(): void
    {
        // Controller with NO searchable, filterable, or sortable columns declared
        $controller = new class extends \Modules\Core\Http\Controllers\BaseController {
            protected string $modelClass = \Modules\Crawler\Models\CrawlJob::class;
            protected array $searchableColumns = [];
            protected array $filterableColumns = [];
            protected array $sortableColumns = [];
        };

        // Create 2 records
        $controller->store(\Illuminate\Http\Request::create('/admin/api/test', 'POST', [
            'source_type' => 'usernames',
            'status' => 'pending',
            'total_accounts' => 10,
        ]));
        $controller->store(\Illuminate\Http\Request::create('/admin/api/test', 'POST', [
            'source_type' => 'urls',
            'status' => 'completed',
            'total_accounts' => 20,
        ]));

        // Search with ?search=usernames should be IGNORED because searchableColumns is empty
        $requestSearch = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'search' => 'usernames',
            'pagination' => 'false',
        ]);
        $responseSearch = $controller->index($requestSearch);
        $this->assertCount(2, $responseSearch->getData(true)['data']);

        // Filter with ?status=completed should be IGNORED because filterableColumns is empty
        $requestFilter = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'status' => 'completed',
            'pagination' => 'false',
        ]);
        $responseFilter = $controller->index($requestFilter);
        $this->assertCount(2, $responseFilter->getData(true)['data']);
    }

    public function test_base_controller_restful_crud_with_search_and_column_filtering(): void
    {
        // Define an anonymous controller extending BaseController with CrawlJob model
        $controller = new class extends \Modules\Core\Http\Controllers\BaseController {
            protected string $modelClass = \Modules\Crawler\Models\CrawlJob::class;
            protected array $searchableColumns = ['source_type', 'status'];
            protected array $filterableColumns = ['status', 'source_type', 'total_accounts'];
            protected array $defaultSort = ['id', 'desc'];
        };

        // 1. Create records using store()
        $requestStore1 = \Illuminate\Http\Request::create('/admin/api/test', 'POST', [
            'source_type' => 'usernames',
            'status' => 'pending',
            'total_accounts' => 10,
        ]);
        $responseStore1 = $controller->store($requestStore1);
        $this->assertEquals(201, $responseStore1->getStatusCode());
        $id1 = $responseStore1->getData(true)['data']['id'];

        $requestStore2 = \Illuminate\Http\Request::create('/admin/api/test', 'POST', [
            'source_type' => 'urls',
            'status' => 'completed',
            'total_accounts' => 20,
        ]);
        $responseStore2 = $controller->store($requestStore2);
        $id2 = $responseStore2->getData(true)['data']['id'];

        // 2. Test show()
        $responseShow = $controller->show($id1);
        $this->assertEquals(200, $responseShow->getStatusCode());
        $this->assertEquals('pending', $responseShow->getData(true)['data']['status']);

        // 3. Test index() with column filter (?status=completed)
        $requestFilter = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'status' => 'completed',
        ]);
        $responseFilter = $controller->index($requestFilter);
        $this->assertEquals(200, $responseFilter->getStatusCode());
        $dataFilter = $responseFilter->getData(true)['data'];
        $this->assertCount(1, $dataFilter);
        $this->assertEquals($id2, $dataFilter[0]['id']);

        // 3b. Test numeric range filter (?total_accounts_min=15)
        $requestNumMin = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'total_accounts_min' => 15,
        ]);
        $responseNumMin = $controller->index($requestNumMin);
        $this->assertCount(1, $responseNumMin->getData(true)['data']);
        $this->assertEquals($id2, $responseNumMin->getData(true)['data'][0]['id']);

        // 3c. Test numeric between range (?total_accounts=5..15)
        $requestNumRange = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'total_accounts' => '5..15',
        ]);
        $responseNumRange = $controller->index($requestNumRange);
        $this->assertCount(1, $responseNumRange->getData(true)['data']);
        $this->assertEquals($id1, $responseNumRange->getData(true)['data'][0]['id']);

        // 3d. Test numeric operator filter (?total_accounts=>=15)
        $requestNumOp = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'total_accounts' => '>=15',
        ]);
        $responseNumOp = $controller->index($requestNumOp);
        $this->assertCount(1, $responseNumOp->getData(true)['data']);
        $this->assertEquals($id2, $responseNumOp->getData(true)['data'][0]['id']);

        // 4. Test index() with search (?search=usernames)
        $requestSearch = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'search' => 'usernames',
        ]);
        $responseSearch = $controller->index($requestSearch);
        $this->assertEquals(200, $responseSearch->getStatusCode());
        $dataSearch = $responseSearch->getData(true)['data'];
        $this->assertCount(1, $dataSearch);
        $this->assertEquals($id1, $dataSearch[0]['id']);

        // 5. Test index() with comma-separated filter (?status=pending,completed)
        $requestMultiFilter = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'status' => 'pending,completed',
            'pagination' => 'false',
        ]);
        $responseMultiFilter = $controller->index($requestMultiFilter);
        $this->assertEquals(200, $responseMultiFilter->getStatusCode());
        $dataMultiFilter = $responseMultiFilter->getData(true)['data'];
        $this->assertCount(2, $dataMultiFilter);

        // 6. Test index() applies default sort (['id', 'desc'])
        $requestSort = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'per_page' => 10,
        ]);
        $responseSort = $controller->index($requestSort);
        $dataSort = $responseSort->getData(true)['data'];
        $this->assertEquals($id2, $dataSort[0]['id']); // id2 > id1, so id desc places id2 first

        // 7. Test index() pagination (?per_page=1)
        $requestPaged = \Illuminate\Http\Request::create('/admin/api/test', 'GET', [
            'per_page' => 1,
        ]);
        $responsePaged = $controller->index($requestPaged);
        $pagedJson = $responsePaged->getData(true);
        $this->assertCount(1, $pagedJson['data']);
        $this->assertEquals(1, $pagedJson['meta']['per_page']);
        $this->assertEquals(2, $pagedJson['meta']['total']);

        // 8. Test update()
        $requestUpdate = \Illuminate\Http\Request::create('/admin/api/test/' . $id1, 'PUT', [
            'status' => 'failed',
        ]);
        $responseUpdate = $controller->update($requestUpdate, $id1);
        $this->assertEquals(200, $responseUpdate->getStatusCode());
        $this->assertEquals('failed', $responseUpdate->getData(true)['data']['status']);

        // 9. Test destroy()
        $responseDestroy = $controller->destroy($id1);
        $this->assertEquals(200, $responseDestroy->getStatusCode());

        // Verify record is deleted
        $responseShowAfterDelete = $controller->show($id1);
        $this->assertEquals(404, $responseShowAfterDelete->getStatusCode());
    }

    public function test_base_controller_resource_class_is_optional_and_usable_when_declared(): void
    {
        // 1. Controller WITHOUT $resourceClass declared
        $controllerNoResource = new class extends \Modules\Core\Http\Controllers\BaseController {
            protected string $modelClass = \Modules\Crawler\Models\CrawlJob::class;
        };

        $created = $controllerNoResource->store(\Illuminate\Http\Request::create('/admin/api/test', 'POST', [
            'source_type' => 'usernames',
            'status' => 'pending',
            'data_crawls' => json_encode(['test_user']),
        ]));
        $id = $created->getData(true)['data']['id'];

        // index() without resourceClass: returns raw model attributes without error
        $indexNoRes = $controllerNoResource->index(\Illuminate\Http\Request::create('/admin/api/test', 'GET', ['per_page' => 5]));
        $this->assertEquals(200, $indexNoRes->getStatusCode());
        $itemNoRes = $indexNoRes->getData(true)['data'][0];
        $this->assertArrayHasKey('data_crawls', $itemNoRes);

        // show() without resourceClass: returns raw model
        $showNoRes = $controllerNoResource->show($id);
        $this->assertEquals(200, $showNoRes->getStatusCode());
        $this->assertArrayHasKey('data_crawls', $showNoRes->getData(true)['data']);

        // 2. Controller WITH $resourceClass declared
        $controllerWithResource = new class extends \Modules\Core\Http\Controllers\BaseController {
            protected string $modelClass = \Modules\Crawler\Models\CrawlJob::class;
            protected ?string $resourceClass = \Modules\Crawler\Resources\CrawlJobResource::class;
        };

        // index() with resourceClass: transforms items via CrawlJobResource (maps data_crawls to data_crawl)
        $indexWithRes = $controllerWithResource->index(\Illuminate\Http\Request::create('/admin/api/test', 'GET', ['per_page' => 5]));
        $this->assertEquals(200, $indexWithRes->getStatusCode());
        $itemWithRes = $indexWithRes->getData(true)['data'][0];
        $this->assertArrayHasKey('data_crawl', $itemWithRes);
        $this->assertArrayNotHasKey('data_crawls', $itemWithRes);

        // show() with resourceClass: transforms record via CrawlJobResource
        $showWithRes = $controllerWithResource->show($id);
        $this->assertEquals(200, $showWithRes->getStatusCode());
        $this->assertArrayHasKey('data_crawl', $showWithRes->getData(true)['data']);
        $this->assertArrayNotHasKey('data_crawls', $showWithRes->getData(true)['data']);
    }
}

