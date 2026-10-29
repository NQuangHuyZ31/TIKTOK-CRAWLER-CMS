---
name: ureka-module-scaffolder
description: Scaffolds Ureka modular architecture boilerplate for Backend and Frontend.
---

# Ureka Module Scaffolder

## 1. Directory Structure (`modules/<ModuleName>/`)
```text
modules/<ModuleName>/
├── database/migrations/
├── routes/api.php
├── resources/js/ (Action/, components/, configs/, pages/, routes/, store/)
└── src/ (Http/Controllers/, Models/, Providers/, Repositories/, Services/)
```

## 2. Standards
- **Backend**: Namespace `Modules\<ModuleName>\`. Extend `BaseController` and `BaseRepository`.
- **Frontend**: Typed API client via `@core/Action/api`. State managed via Redux slice in `store/`.
- **Verification**: Run `npm.cmd run check-types` and `php artisan test`.
