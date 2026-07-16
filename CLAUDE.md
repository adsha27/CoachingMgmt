
## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Git & Deployment Discipline

Workflow: **trunk-based** (short-lived branches, frequent merges to `main`) — not GitFlow. GitFlow's long-lived release branches only earn their cost with scheduled/versioned releases; this project ships continuously.

1. **Never deploy uncommitted code.** `vercel --prod` (or any deploy) only runs against a clean tree that matches what's committed — commit first, deploy second, never the reverse. Production must always be reconstructable from git history alone.
2. **Commit, then push, every session.** Don't let local commits sit unpushed — `origin` is the backup. A crashed laptop should never be the only copy of finished work.
3. **Branch for anything non-trivial**: schema changes, auth/security changes, new features touching 3+ files. One-line fixes and config tweaks can go straight to `main`. Merge/delete the branch same-day — no long-lived branches.
4. **Conventional Commits** format (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`) — one logical change per commit, imperative mood, why over what in the body when it's not obvious.
5. **Secrets never touch git.** Env vars only, injected at deploy time (Vercel env, not `.env` files committed). If a secret-protected endpoint or token is created for a one-off task (e.g. a bootstrap script), delete it immediately after use — don't leave standing unauthenticated-except-for-a-secret surface area.
6. **Schema changes go through Prisma migrations**, not ad hoc `db push` against the production Neon branch. Prefer testing against a Neon dev branch before touching `production`.
7. **One change per deploy where feasible** — smaller diffs are easier to attribute if something breaks, and easier to revert.
8. **Before shipping**: typecheck clean, tests passing where runnable in the current environment (call out explicitly if a test suite couldn't run — e.g. no local DB/Docker — never claim untested code is verified).
9. **Never delete a production secret to modify it — add/replace first, remove only after confirming the replacement is live.** If a Vercel env var is scoped to multiple environments (check `vercel env ls` output for entries listing more than one environment), removing it for just one environment can delete the whole shared entry, not split it — this took Production down on 2026-07-16 when splitting a Preview+Production `DATABASE_URL` deleted both. For any production credential change: add the new value first, verify it, only then remove the old one — never delete-then-add.

Sources consulted: [Trunk-Based Development vs Gitflow (Mergify)](https://mergify.com/blog/trunk-based-development-vs-gitflow-which-branching-model-actually-works), [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), [CI/CD Best Practices (Harness)](https://www.harness.io/blog/ci-cd-best-practices), [The startup founders' guide to software delivery (CircleCI)](https://circleci.com/blog/startup-founders-guide-to-software-delivery/).
