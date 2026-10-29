# Release Management & Semantic Versioning Manual

This document details the release management lifecycle, Semantic Versioning standards, Draft Release automation, and publication procedures for the `cms-tiktok-crawler` platform.

---

## 1. Semantic Versioning Specification (SemVer 2.0.0)

Version numbers follow the strict standard:

$$\textbf{vMAJOR.MINOR.PATCH}$$

- **MAJOR (X.0.0)**: Incompatible API breaks, database schema rewrites requiring breaking migrations, or major architectural shifts.
- **MINOR (0.X.0)**: Backward-compatible new features, new API endpoints, new modules, or database additions that do not break existing queries.
- **PATCH (0.0.X)**: Backward-compatible bug fixes, performance optimizations, or maintenance updates.

*Pre-release identifiers* (e.g., `v1.2.0-rc.1`, `v1.2.0-beta`) may be used for testing candidates.

---

## 2. Release Candidate Preparation & Draft Automation

### Step 2.1: Version Bump in Worktree
When a release is planned, create a release chore branch in a persistent worktree:
```powershell
.\scripts\agent-worktree.ps1 -WorktreeIndex 1 -Branch "chore/release-v1.1.0" -CreateBranch
```

Update the `version` field in `cms-tiktok-crawler/package.json`:
```json
{
  "name": "cms-tiktok-crawler",
  "version": "1.1.0"
}
```

Commit the change adhering strictly to the release commit format:
```powershell
git commit -m "chore(release): bump version to 1.1.0"
```

Push and open a Pull Request to `main`:
```powershell
git push -u origin chore/release-v1.1.0
```

### Step 2.2: Automated Draft Release Generation
Once the PR is approved and merged into `main`, GitHub Actions (`auto-draft-release.yml`) executes automatically:
1. Detects the version bump (`1.0.0` $\rightarrow$ `1.1.0`).
2. Builds the frontend distribution bundle (`npm ci`, `npm run check-types`, `vite build`).
3. Packages a release archive asset: `dist/cms-tiktok-crawler-v1.1.0.tar.gz`.
4. Compiles the Conventional Commits changelog since the last tag.
5. Publishes a **GitHub Draft Release** tagged `v1.1.0` with the candidate commit SHA.

> [!IMPORTANT]
> **A Draft Release NEVER triggers production deployment.**
> The Draft Release acts as an immutable holding state for release managers to review changelog accuracy, run pre-flight checks, and schedule publication.

---

## 3. Release Notes Structure

Every generated release note contains:
1. **Candidate Header**: Version tag, exact target commit SHA, generation timestamp.
2. **Conventional Commits Changelog**: Structured list of commits categorised by `feat`, `fix`, `refactor`, `chore`.
3. **Quality Gates Passed**: Summary of TypeScript check, backend tests, and build artifacts.
4. **Migration & Operational Notes**: Any database migration requirements (`php artisan migrate`) or environment variable updates.
5. **Deployment & Rollback Instructions**: Post-release procedures and rollback steps.

---

## 4. Release Review, Approval & Publication

1. Navigate to the GitHub repository **Releases** page (`https://github.com/NQuangHuyZ31/TIKTOK-CRAWLER-CMS/releases`).
2. Open the **Draft** release.
3. Review the changelog, linked issues, and package archive.
4. If adjustments are needed, edit the markdown notes directly.
5. Click **Publish release**.

**Trigger Result**:
Publishing the release emits the `release: published` GitHub webhook event, which automatically activates `.github/workflows/deploy.yml` to initiate controlled Render production deployment with health checks.

---

## 5. Candidate Invalidation & Re-Roll

If an issue is found in a candidate **before publication**:
1. Do **NOT** publish the draft release.
2. Fix the defect in a new worktree branch (`fix/PROJ-xxx-issue`).
3. Merge the fix into `main`.
4. Delete the invalid draft release in GitHub Releases UI, or let the new version bump override it.
5. The commit SHA of the draft release must always match the verified candidate.
