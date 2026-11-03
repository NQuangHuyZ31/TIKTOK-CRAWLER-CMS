# API Routing & Contract Standards

This document describes the dynamic API routing engine, controller action resolution, response structures, and HTTP error contracts.

---

## 1. Dynamic Route Resolution Engine (`DynamicRouteResovle`)

Unlike traditional Laravel applications where routes are statically defined in `routes/api.php`, the CMS uses a dynamic route resolution engine located in `Modules\Core\Support\DynamicRouteResovle`.

### Supported URL Patterns

| Pattern | URL Structure | Resolves To | Action Method |
| :--- | :--- | :--- | :--- |
| **Pattern 1** | `/{module}/{controller}/{id}/{action}` | `Modules\<Module>\Http\Controllers\<Controller>Controller` | Method matching `{action}` with `$id` |
| **Pattern 2** | `/{module}/{controller}/{action}` | `Modules\<Module>\Http\Controllers\<Controller>Controller` | Method matching `{action}` without `$id` |
| **Pattern 3** | `/{module}/{controller}/{id}` | `Modules\<Module>\Http\Controllers\<Controller>Controller` | RESTful `show` (GET), `update` (PUT/PATCH), `destroy` (DELETE) |
| **Pattern 4** | `/{module}/{controller}` | `Modules\<Module>\Http\Controllers\<Controller>Controller` | RESTful `index` (GET) or `store` (POST) |
| **Fallback** | `/{module}/{action}` | `Modules\<Module>\Http\Controllers\<Module>Controller` | Method matching `{action}` on default module controller |

### Critical Security Rule
**Every `public` method on a controller is directly reachable as an HTTP endpoint.**
Any internal helper function or sub-routine on a controller class MUST be declared `protected` or `private`.

---

## 2. Authorization & Middleware (`CheckModulePermission`)

Dynamic routes are intercepted by `CheckModulePermission` middleware:
1. Derives the requested module from the first URL segment.
2. Resolves the permission action (`view`, `create`, `edit`, `delete`) based on the HTTP method and action name.
3. Checks whether the authenticated user holds the required permission.
4. Returns HTTP `403 Forbidden` if unauthorized.
5. Modules listed under `'ignore_check_permission'` in `modules/Core/configs/modules.php` (such as `auth`) are exempt from permission verification.

---

## 3. Standard Response Format (`ApiResponseTrait`)

All JSON responses must conform to the standard structure defined by `Modules\Core\Traits\ApiResponseTrait`:

### Success Response (`respondSuccess`)
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { ... }
}
```

### Paginated Response (`respondPaginated`)
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 120,
    "last_page": 8
  }
}
```

### Error Response (`respondError`)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": ["The name field is required."]
  }
}
```

---

## 4. HTTP Status Code Conventions

- `200 OK`: Successful read or update.
- `201 Created`: Successful creation of a new entity.
- `202 Accepted`: Asynchronous task accepted for processing (e.g. crawl job dispatch).
- `400 Bad Request`: Generic client error or malformed request parameters.
- `401 Unauthorized`: Missing or invalid Sanctum Bearer token.
- `403 Forbidden`: Insufficient user permissions for the module/action.
- `404 Not Found`: Entity or dynamic endpoint does not exist.
- `422 Unprocessable Entity`: FormRequest validation failure.
- `500 Internal Server Error`: Unhandled application exception (logged to Laravel logs).
