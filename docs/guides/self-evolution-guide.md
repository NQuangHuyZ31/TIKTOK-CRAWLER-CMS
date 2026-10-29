---
name: self-evolution-guide
description: Maintains documentation in docs/ and custom skills in .agents/skills/.
---

# Autonomous Self-Evolution Guide: Skills & Documentation

This skill defines the procedures and standards for the agent to autonomously extend the project's knowledge base, create new runbooks, and maintain repository documentation.

---

## 1. When to Create a New Skill or Documentation

The agent has full authority and responsibility to autonomously create or update documentation and skills when:
1. **Recurring Workflows**: A multi-step command or procedure is repeated across multiple sessions (e.g., seeding crawler test data, setting up new RBAC permissions, running performance benchmarks).
2. **New Subsystems / Integrations**: A third-party service (e.g., TikTok Scraping API, S3 storage, Redis queue) is introduced.
3. **Architectural Additions**: A new design pattern, middleware, or state management practice is adopted.
4. **Knowledge Gaps**: A task reveals missing runbooks or ambiguities in existing guides.

---

## 2. Creating a New Workspace Skill (`.agents/skills/<name>/SKILL.md`)

Each skill must follow the standard Antigravity structure:
```text
.agents/skills/<skill-name>/
├── SKILL.md                 # Required: Main runbook with YAML frontmatter
├── scripts/                 # Optional: Shell/PowerShell scripts
├── examples/                # Optional: Example snippets
└── references/              # Optional: Deep architectural manuals
```

### 2.1. Skill Template (`SKILL.md`)
```markdown
---
name: <kebab-case-name>
description: Maintains documentation in docs/ and custom skills in .agents/skills/.
---

# <Skill Title>

## 1. Context & Purpose
Explain why this skill exists and what problems it solves.

## 2. Step-by-Step Instructions
1. Step 1...
2. Step 2...

## 3. Verification & Validation Commands
Commands to verify success (e.g., test suites, typechecks, log inspections).
```

### 2.2. Rules for Skills:
- **Language**: English strictly.
- **Actionable**: Focus on concrete commands, code templates, and clear validation steps.
- **Do Not Duplicate**: Reference existing docs in `docs/` rather than re-explaining general repository rules.

---

## 3. Authoring New Documentation in `docs/`

When a subject is broad or intended for human developers as well as agents:
1. Create `docs/<SUBJECT_NAME>.md` in uppercase naming (e.g., `docs/QUEUE_WORKERS_GUIDE.md`).
2. Add a clear summary table, code samples, and practical step-by-step instructions.
3. Update the Documentation Index in [`AGENTS.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/AGENTS.md) to link to the new guide.
4. Maintain documentation integrity: all text, headings, diagrams, and comments must be in professional English.

---

## 4. Verification

After creating any new skill or documentation:
1. Check markdown links to ensure they use proper relative or `file:///` URLs.
2. Confirm YAML frontmatter has both `name` and `description` fields.
3. Run `npm.cmd run check-types` if any code snippets were modified or created.
