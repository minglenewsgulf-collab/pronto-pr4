# PRONTO PR - Project Context

This document is the working context for AI coding agents helping with PRONTO PR.

Repository status: the repository has now been inspected. PRONTO PR is currently a Lovable/TanStack frontend prototype with localStorage persistence. Task 1 Supabase foundation has been added, but the app still intentionally runs on the existing localStorage store until Auth, database schema, RLS, and data migration are implemented.

## Current Repository Facts

Confirmed by code:

- Framework: React 19 + TypeScript.
- App framework/routing: TanStack Start and TanStack Router with file-based routes in `src/routes`.
- Build tooling: Vite through `@lovable.dev/vite-tanstack-config`.
- Styling: Tailwind CSS 4, Radix UI / shadcn-style components, lucide-react icons.
- Charts: Recharts.
- Notifications: Sonner.
- Current persistence: React Context in `src/lib/store.tsx` plus browser `localStorage`.
- Current auth: login/register/logout are wired to Supabase Auth email/password. Supabase session is restored on refresh. Reports, drafts, workspace, and publication mock data still use localStorage.
- Current publication analysis: deterministic mock generation in `analyzeUrls()`.
- Current PREI display: prototype score on a 0-10 scale, not the final Excel-backed 0-100 formula.
- Current backend: no real backend routes for product data yet.
- Supabase foundation: `@supabase/supabase-js`, `.env.example`, `src/lib/supabase`, and `src/lib/data` have been added.
- Supabase Auth service layer: `src/lib/auth` exists and login/register/logout now call it. The UI design was preserved.
- Typed data layer interfaces and repository contracts have been added under `src/lib/data`, but they are not connected to UI or Supabase calls yet.
- Storage helper layer for the `exports` bucket exists under `src/lib/storage`.
- The existing report export dialog now connects the Download PDF action to Supabase Storage through `src/lib/storage/reportExport.ts`. It creates an MVP placeholder `.xlsx` file, uploads it to the `exports` bucket, inserts an `exports` table record, downloads the uploaded file back from Storage, and saves the existing local Draft entry. The UI text/layout is unchanged.
- The application store now uses Supabase for `campaigns`, `reports`, and `exports` through `src/lib/data/supabaseAppData.ts`. Reports are loaded from Supabase on auth/session hydration. Creating a report creates a Supabase campaign plus a report snapshot. Exports are loaded from the `exports` table and displayed through the existing Drafts UI shape. Workspace input/publication analysis still uses local in-memory state and deterministic mock analysis.

Not implemented yet:

- Supabase Auth is wired to login/register/logout. Remaining auth work is production hardening, password reset, profile persistence, and connecting database-backed user data.
- PostgreSQL schema and migrations.
- RLS policies.
- Supabase Storage bucket setup.
- Supabase Edge Functions.
- External data APIs.
- LLM/AI structured JSON pipeline.
- Real PREI v1.0 calculation.
- Replacement of localStorage store with database-backed data.

Important Lovable rule from `AGENTS.md`:

- This project is connected to Lovable.
- Do not rewrite published git history with force-push, rebase, amend, or squash of already pushed commits.
- Keep the connected branch in a working state.

## 1. Project Overview

PRONTO PR is an AI-powered SaaS platform for automated PR analytics.

Confirmed from available materials:

- Product purpose: automate PR analytics for media publications.
- Target user: PR specialists and PR teams.
- Main value: replace manual PR reporting with AI-assisted scoring, explanations, dashboards, and reports.
- Long-term goal: become an AI-first PR analytics platform rather than a traditional media monitoring tool.
- Core input: publication URL according to the Excel architecture; earlier product context also mentions URL or pasted article text. This conflict must be confirmed later.
- Core output: publication-level PR impact scores plus explanations, campaign-level reports, dashboards, and exports.

PREI / PR index:

- The Excel formula sheet describes an MVP PR index model version 1.0.
- It calculates two independent indexes per publication:
  - IndustryImpact: influence on the industry.
  - PublicImpact: public/social influence.
- Scale: 0-100.
- The index is an influence strength score, not a percentage.
- Formulas are hidden from end users.

The system should automate:

- article URL intake;
- domain normalization;
- article metadata extraction where available;
- domain/source metric enrichment;
- AI/LLM evaluation for language, sentiment, placement and content-related analysis;
- PREI/PR index calculation;
- campaign aggregate recalculation;
- report snapshot generation;
- XLS export storage and download.

## Signup password note

The current Lovable signup modal does not include a separate password field. To preserve the existing UI, account creation currently uses the password typed in the main sign-in password field. A future UX task should decide whether to add a dedicated password field or a separate signup screen.

## 2. Current Stage

Confirmed from product context:

- The project is between prototype and MVP completion.
- A designed interface exists in Lovable.
- A frontend prototype exists and has used demo/mock data.
- Current priority is moving from prototype/mock data to a real working product.

The project description says these pieces already exist:

- authentication;
- workspace structure;
- publication upload;
- database;
- backend API;
- AI pipeline;
- report generation.

Repository status:

- Repository inspected.
- Current implementation is a frontend/localStorage prototype.
- Supabase foundation files have been added, but Supabase is not wired into user flows yet.

Current work focus:

- stabilize the platform;
- improve UX;
- refine AI prompts;
- fix edge cases;
- polish frontend components;
- prepare for beta / Early Access testing.

## 3. Founder / User Context

The product owner is not a developer and will work with AI coding tools in conversational mode.

Future AI coding agents must:

- explain changes in simple language;
- avoid unnecessary jargon;
- avoid major refactoring without explicit approval;
- work in small safe steps;
- always explain what was changed, why it was changed, and what should be checked next;
- ask for confirmation before destructive changes, database resets, schema rewrites, or architecture changes.

## 4. Product Flow

Intended flow from available materials:

1. User logs in.
2. User opens Dashboard or a campaign.
3. User adds/uploads a publication.
4. System extracts or normalizes URL/domain and article metadata.
5. System checks DomainMetricsCache.
6. If cache is absent or stale, system fetches domain/source metrics.
7. AI analyzes available content/metadata.
8. System calculates PREI / PR indexes.
9. Publication appears as a card/list item with status and score.
10. User opens detailed scoring and AI explanations.
11. User generates or opens a report.
12. System creates a campaign-level report snapshot and aggregates results.
13. User can export/download XLS.

Conflict to confirm:

- Earlier product context says users can submit URL or article text.
- Excel architecture says article cards are created only from URL and text of the article is not stored; the data sources sheet says the user inputs only URL.
- Treat URL-only as the current Excel-backed MVP direction unless the product owner confirms pasted text input remains in scope.

## 5. Existing UI / Lovable

Confirmed from available materials:

- Lovable is the current source of truth for the interface.
- The UI is already designed.
- A frontend prototype exists on demo/mock data.

UI rules:

- Preserve existing UX unless explicitly asked to change it.
- Do not invent new screens unless requested.
- Replace mock data with real data without unnecessarily changing the interface.
- Keep the style light, clean, enterprise-style, minimal, modern SaaS.
- Prioritize readability, clear statuses, and predictable flows over decoration.
- Reuse existing components when the repository is available.

Main UI modules described:

- Authentication: login, registration, session management.
- Dashboard: publication statistics, average PR score, activity, recent publications/projects.
- Publications: list, upload/input form, search, filters, cards, status indicators.
- Publication details: overall score, criteria, explanations, extracted metadata, AI reasoning.
- Reports: average score, trends, charts, distribution, export.

## 6. Expected Technical Direction

Expected / planned stack from materials:

- Frontend: React / TypeScript, expected but not confirmed by repository.
- Backend: Supabase, expected/default.
- Database: PostgreSQL through Supabase.
- Authentication: Supabase Auth.
- Storage: Supabase Storage, especially an `exports` bucket.
- Backend logic: Supabase Edge Functions or backend API, exact implementation unknown.
- Security: Supabase RLS.
- External data APIs: PR-CY, Similarweb, Semrush, Ahrefs/Majestic where applicable.
- AI: LLM-based content analysis returning structured JSON.
- Previous plan mentions Replit env vars; actual hosting/deployment is Unknown.

Confirmed from repository:

- Frontend framework: React 19 + TypeScript.
- App framework/routing: TanStack Start / TanStack Router.
- Build tool: Vite through Lovable TanStack config.
- Styling: Tailwind CSS 4 with Radix/shadcn-style components.
- State management: React Context in `src/lib/store.tsx`.
- Persistence today: browser `localStorage`.
- Supabase client foundation: added in `src/lib/supabase`.

Still unknown / not implemented:

- package manager workflow in production; repo includes `bun.lock`.
- API layer for product data.
- Supabase migrations and database schema.
- deployed URLs.
- CI/CD and hosting.

## 7. Data Sources

Confirmed from Excel sheet `Источники данных`:

- Product works across two markets: RU and EU/INTL.
- Data sources differ by market.
- RU: PR-CY for authority and traffic.
- EU/INTL: Similarweb + Semrush for traffic.
- EU/INTL: Ahrefs/Majestic for authority, optional.
- Domain cache is used, with refresh at least every 30 days.
- Media type is determined automatically through Similarweb category plus internal mapping.
- Title is always parsed.
- Article text is parsed when possible.
- Processing statuses are hidden from the user.
- User inputs only URL according to this sheet.

Source summary:

| Source | Region / Market | Purpose | Fields or Metrics | Expected Usage in PREI | Status | Unknowns |
| --- | --- | --- | --- | --- | --- | --- |
| PR-CY | RU | Authority and traffic | authority, traffic | AuthorityScore and ReachScore inputs | Planned / Excel-listed | API contract, auth, limits, pricing, exact fields |
| Similarweb | EU/INTL | Traffic and category | traffic, category | ReachScore, media type mapping | Planned / Excel-listed | API contract, auth, limits, pricing, exact fields |
| Semrush | EU/INTL | Traffic | traffic | ReachScore fallback or enrichment | Planned / Excel-listed | API contract, auth, limits, pricing, exact fields |
| Ahrefs | EU/INTL | Authority | authority | AuthorityScore, optional | Optional / Excel-listed | Whether included in MVP, API contract, pricing |
| Majestic | EU/INTL | Authority | authority | AuthorityScore, optional | Optional / Excel-listed | Whether included in MVP, API contract, pricing |
| Internal mapping | All | Media type classification | mapping from external category to media type | IndustryMediaScore/PublicMediaScore | Planned | Exact mapping table |

Domain metrics cache:

- Stores metrics at normalized domain level, e.g. `example.com`.
- `www` is merged into the base domain.
- Subdomains are treated as part of the main domain.
- Uses primary source and fallback secondary source.
- Architecture sheet says TTL is 24 hours and forced refresh occurs when adding a card if cache is older than 6 hours.
- Data sources sheet says cache refresh happens at least every 30 days.
- This TTL conflict must be confirmed.

Expected cache fields from Excel architecture:

- `domain`
- `fetched_at`
- `expires_at`
- `source_used`
- `metrics_json`
- `missing_json`

Override of domain metrics is not used at MVP stage.

## 8. PREI Formula

Confirmed from Excel sheet `формула индекса`.

Model name:

- MVP PR-index model version 1.0.

General logic:

- Two independent indexes are calculated for each publication:
  - `IndustryImpact`: influence on the industry.
  - `PublicImpact`: public influence.
- Both are calculated automatically inside the model.
- Formula is not shown to users.
- Scale is 0-100.
- Values are not percentages.
- No manual corrections or multipliers in MVP.
- Model is intended to be universal for international use.

Input normalization:

- All input parameters are normalized to 0-100.

Components:

1. `ReachScore`
   - Uses a soft logarithmic calculation capped at 100.
   - Purpose: smooth the effect of very large media outlets and prevent huge reach from dominating.
   - Exact logarithmic formula is Unknown / to be confirmed.

2. `AuthorityScore`
   - Source scale: 1-10.
   - Converted by multiplying by 10.
   - Result: 0-100.

3. `ToneScore`
   - Negative: 20.
   - Neutral: 60.
   - Positive: 100.
   - Negative is not zero because even negative publications can create influence.

4. `PlacementScore`
   - News: 40.
   - Comment: 60.
   - Interview: 80.
   - Author column: 100.
   - Format affects depth of impact.

5. Media type score

| Media type | IndustryMediaScore | PublicMediaScore |
| --- | ---: | ---: |
| Industry-specific | 100 | 50 |
| Adjacent industry | 80 | 65 |
| Federal business | 70 | 85 |
| Large general/political | 50 | 100 |
| Regional | 40 | 40 |

IndustryImpact formula:

`IndustryImpact = 0.20 * Reach + 0.25 * Authority + 0.10 * Tone + 0.20 * Placement + 0.25 * IndustryMediaScore`

Logic:

- Expertise and industry relevance are key factors.
- Publication format is important.
- Reach is secondary.
- Tone influences the result but does not dominate.

PublicImpact formula:

`PublicImpact = 0.35 * Reach + 0.20 * Authority + 0.20 * Tone + 0.15 * Placement + 0.10 * PublicMediaScore`

Logic:

- Mass reach is the main factor.
- Emotional tone is important.
- Media type strengthens public effect.
- Authority has moderate influence.

Interpretation:

| Score | Meaning |
| --- | --- |
| 0-30 | Weak influence |
| 30-50 | Moderate influence |
| 50-70 | Noticeable influence |
| 70-85 | Strong influence |
| 85-100 | Strategic influence |

Objective vs AI-evaluated inputs:

- Objective/external: reach, authority, source/domain metrics.
- Derived/mapped: media type, based on Similarweb category plus internal mapping.
- AI-evaluated or parser-assisted: tone/sentiment, placement/publication type, language, summaries/explanations.
- Unknown: exact division between deterministic parser, external API, and LLM for placement/media type in final implementation.

Campaign semantic analytics:

- Word cloud of headlines.
- Word cloud of article texts.
- This does not affect the index formula; it is for agenda/content analysis.

## 9. AI Evaluation Logic

Confirmed / expected rules:

- AI analyzes article content or available extracted text/metadata.
- AI must return structured JSON, not free-form text.
- AI output must be validated before saving.
- Frontend must not parse free-form AI responses.
- AI must not invent missing external metrics.
- AI explanations support the score but do not replace formula-based scoring.
- LLM output must be deterministic enough for scoring.

Expected AI responsibilities:

- language detection, unless handled by a separate deterministic service;
- sentiment/tone classification;
- publication type / placement classification where not available deterministically;
- summary and score explanations;
- possibly content normalization for semantic analytics.

Expected pipeline:

1. URL input.
2. Content/metadata extraction where possible.
3. Normalization.
4. Prompt construction.
5. LLM evaluation.
6. Structured JSON response.
7. Validation.
8. Database persistence.
9. Frontend visualization.

Validation rules to implement or verify:

- required fields must exist;
- enum values must match allowed values;
- numeric scores must be within 0-100;
- missing external metrics must remain missing/fallback, not hallucinated;
- model/version metadata should be stored where relevant.

## 10. Expected Data Model

This is an expected data model based on Excel and product context, not a verified database schema.

### User

Purpose: authenticated platform user.

Known details:

- Supabase Auth is expected.
- Email should live only in `auth.users` according to Excel architecture.
- Business tables store `owner_id`, not email.

Unknown fields: Unknown / to be confirmed when repository is available.

### Workspace / Account

Purpose: account/workspace grouping if implemented.

Known fields: Unknown / to be confirmed when repository is available.

Note: Excel architecture says campaigns are not multi-user and have one owner. Workspace/account may be absent or future scope.

### Campaign

Purpose: long-lived folder/container for article cards and periodic reports.

Confirmed behavior:

- long-term living container;
- one owner;
- not multi-user;
- no campaign statuses listed;
- can receive unlimited new URLs;
- supports excluding links via status, not physical delete;
- supports report snapshots;
- stores active and last-report aggregates for faster UI loading.

Expected aggregate fields from Excel:

- `active_articles_count`
- `active_prei_total`
- `active_prei_avg`
- `active_reach_total`
- `last_report_date`
- `last_report_articles_count`
- `last_report_prei_total`
- `last_report_prei_avg`
- `last_report_reach_total`

Unknown fields: exact table name, timestamps, constraints, indexes.

### Article / Publication

Purpose: publication card inside a campaign.

Confirmed behavior from Excel:

- created only from URL for MVP;
- article text is not stored;
- screenshot or snippet is optional;
- inside one campaign, a canonical URL can appear only once;
- same URL can appear in different campaigns;
- unique index expected on `campaign_id + url_canonical`.

Expected automatic fields:

- reach, not editable;
- sentiment, not editable;
- impact, not editable;
- placement, can be overridden;
- PREI/final indexes;
- PREI component JSON;
- formula version.

Statuses:

- `active`: participates in current calculations.
- `removed`: excluded by user.
- `broken`: URL unavailable or request error.
- `missing`: publication removed, e.g. 404.

Status rules:

- Cards are not physically deleted.
- Backend link-checking process sets automated statuses.
- User can only set `removed` manually.

### Report

Purpose: periodic snapshot of a living campaign.

Confirmed behavior:

- Selects all `status='active'` cards that have not yet been included in a report.
- Sets `report_date`.
- Sets `is_locked = true`.
- Fixes PREI at the report snapshot moment.
- Older reported cards remain in history.
- New links are added as unlocked.

Unknown fields: exact report table and relations.

### Source / Domain

Purpose: represent normalized media domain/source and classification.

Known fields: Unknown / to be confirmed when repository is available.

### DomainMetricsCache

Purpose: cache domain-level external metrics.

Expected fields:

- `domain`
- `fetched_at`
- `expires_at`
- `source_used`
- `metrics_json`
- `missing_json`

Confirmed rules:

- normalized at base domain level;
- `www` merged;
- subdomains treated as part of main domain;
- primary and fallback secondary sources;
- no manual override in MVP;
- client access closed; backend/service role only.

### AIAnalysis

Purpose: store validated AI output.

Expected data:

- structured JSON output;
- sentiment/tone;
- placement classification;
- summaries;
- criteria explanations;
- prompt/model/version metadata.

Unknown fields: final JSON schema and table design.

### PREIScore

Purpose: store final score/index calculations and formula inputs.

Expected data:

- `IndustryImpact`;
- `PublicImpact`;
- component scores;
- formula version;
- calculation timestamp.

Unknown: whether stored separately or embedded in articles.

### Export

Purpose: generated XLS exports.

Expected behavior:

- generate XLS;
- upload to Supabase Storage `exports` bucket;
- provide download button.

Current implementation:

- `src/lib/storage/exports.ts` contains bucket helpers.
- `src/lib/storage/reportExport.ts` connects the existing report Download PDF button to Supabase Storage and the `exports` table.
- The exported file is an MVP placeholder `.xlsx` containing CSV-style tabular report data inside a Blob. It is not a true Excel workbook yet.
- Because reports still originate from localStorage, the export service creates a minimal Supabase campaign/report bridge before inserting the export record.

## 11. Backlog / Roadmap

Source: Excel sheet `PREI_Backlog_P0`.

The sheet does not explicitly label P1/P2; it is named P0 and appears to describe MVP/P0 work. Preserve order by `Шаг`.

| Step | Epic / Block | Task | Definition of Done | Estimate, hours |
| --- | --- | --- | --- | ---: |
| 0 | PREI v0.1 | Fix PREI formula | Formula and coefficients are described and saved | 1.0 |
| 1 | Architecture | Create Supabase project | Project created | 0.5 |
| 1 | Architecture | Connect Supabase to Replit | env vars work | 1.0 |
| 1 | Architecture | Auth email/password | Registration and login work | 1.5 |
| 1 | Architecture | Storage bucket exports | Bucket is available | 0.5 |
| 2 | Database | Design DB schema | Tables and relations approved | 2.0 |
| 2 | Database | Create tables | All tables created | 1.5 |
| 2 | Database | Relations and FK | No relation errors | 1.0 |
| 2 | Database | RLS policies | User sees only own data | 2.0 |
| 3 | Account | Signup screen | Registration works | 1.5 |
| 3 | Account | Login screen | Login works | 1.0 |
| 3 | Account | Dashboard | Projects are displayed | 2.0 |
| 3 | Account | Create project | Project is saved | 1.5 |
| 4 | Publications | Link input form | Can paste a list of links | 1.0 |
| 4 | Publications | Domain parsing | Domain is extracted correctly | 1.5 |
| 4 | Publications | Save publications | DB insert works | 1.5 |
| 4 | Publications | Create report | Report is created | 1.0 |
| 5 | API pipeline | Similarweb API | Traffic data is received | 3.0 |
| 5 | API pipeline | Authority API | Authority is received | 3.0 |
| 5 | API pipeline | Language detect | Language is detected | 1.5 |
| 5 | API pipeline | Sentiment (LLM) | Tone is calculated | 3.0 |
| 5 | API pipeline | PREI calculation | PREI is calculated by formula | 2.0 |
| 5 | API pipeline | Save metrics | Metrics are written to DB | 1.5 |
| 6 | Cards | Remove demo-random | Only real data | 1.0 |
| 6 | Cards | Render from DB | Cards use saved data | 2.0 |
| 6 | Cards | Loading statuses | loading/ready are displayed | 1.5 |
| 7 | Reports | Report aggregates | Totals are calculated | 1.5 |
| 7 | Reports | Report history | Old reports are available | 2.0 |
| 8 | Export | Generate XLS | XLS file is created | 2.5 |
| 8 | Export | Upload to Storage | File is stored | 1.5 |
| 8 | Export | Download button | File downloads | 1.0 |

Weekly plan from Excel sheet `план понедельный`:

- Week 1, Initialization: PREI v0.1 formula, create Supabase project, check data model, connect Supabase to Replit, enable email/password auth.
- Week 2, Data: create Storage bucket, design DB schema, create Supabase tables.
- Week 3, Security: configure table relations, RLS policies, user access checks.
- Week 4, Account: Signup, Login, Dashboard with projects list.
- Week 5, Projects: project creation, link input form, URL/domain parsing.
- Week 6, Reports: save publications, create report, link report with publications.
- Week 7, API: Similarweb API and monthly visits.
- Week 8, API: Authority API and authority metric normalization.
- Week 9, Tone: language detection and multilingual LLM sentiment.
- Week 10, PREI: formula implementation, save metrics + formula version, remove demo data.
- Week 11, UX: loading/processing/ready statuses and report history.
- Week 12, Export: XLS generation and upload to Supabase Storage.
- Week 13, Launch: Download button, end-to-end check, Early Access preparation.

Progress indicators from Excel:

- Sheet shows 38 total items, 5 completed, 33 remaining.
- Completed rows visible include PREI formula fixation, Supabase project creation, and data model check; two rows appear as numeric references in the parsed sheet and must be manually verified in Excel UI.
- Treat progress as planning-file status, not repository-verified status.

## 12. MVP Priorities

Excel-backed priority order:

1. Fix PREI v0.1 formula and coefficients.
2. Set up Supabase project and env vars.
3. Implement email/password auth.
4. Create Supabase Storage `exports` bucket.
5. Design and create database schema.
6. Add foreign keys and RLS so users only see their own data.
7. Implement Signup/Login/Dashboard/project creation.
8. Add link input, domain parsing, and publication persistence.
9. Create reports and report-publication linkage.
10. Integrate Similarweb traffic data.
11. Integrate authority API and normalize authority.
12. Add language detection and multilingual LLM sentiment.
13. Implement PREI calculation and save metrics/formula version.
14. Remove demo/random data and render real cards from DB.
15. Add loading/processing/ready statuses.
16. Add report aggregates and report history.
17. Generate XLS exports, upload to Storage, and add Download button.
18. Run end-to-end check and prepare Early Access.

## 13. Development Rules for Future AI Agents

Future agents must:

- never claim the repository was analyzed unless actual code is present and inspected;
- never invent existing files, APIs, tables, migrations, or components;
- preserve Lovable UI unless explicitly asked to change it;
- prefer incremental implementation over rewrites;
- avoid major refactors without explicit approval;
- use TypeScript where applicable;
- keep business logic separate from UI;
- validate AI outputs before saving;
- keep Supabase as the default backend unless the product owner decides otherwise;
- preserve database compatibility once schema exists;
- avoid breaking API contracts;
- maintain strict typing;
- avoid duplicated logic;
- document non-obvious decisions;
- keep async states explicit and user-understandable;
- explain all changes simply.

Specific product rules from Excel:

- Do not physically delete article cards; use statuses.
- User can manually mark only `removed`.
- Backend jobs manage `broken` and `missing`.
- Domain metrics cache is backend-only and hidden from client.
- `service_role` must be used only on backend.
- Business tables should store `owner_id`, not user email.
- Formula version must be stored with metrics/scores.
- Report snapshots lock included articles and freeze PREI values.
- Demo/random data must be removed before production MVP.

## 14. What Must Be Confirmed Later From the Real Repository

Confirmed now:

- Actual folder structure: root contains duplicated Lovable export files plus canonical `src/` implementation.
- `package.json` exists.
- Frontend framework: React 19 / TypeScript.
- Routing: TanStack Router file routes.
- Existing components: app shell, publication card/modal, word cloud, shadcn/Radix UI set.

Still to confirm / implement:

- Lovable export structure;
- Supabase project config;
- migrations;
- database schema;
- RLS policies;
- Edge Functions or backend API routes;
- API calls;
- environment variables;
- deployed URLs;
- existing mock data structure;
- current authentication implementation;
- current publication upload implementation;
- current URL/article extraction implementation;
- whether pasted article text is still in MVP scope;
- current AI pipeline implementation;
- current report implementation;
- export implementation;
- tests;
- deployment process;
- exact cache TTL rule: 24 hours / 6-hour forced refresh vs 30-day refresh.

## 15. How To Update This Context Later

After the real repository is added, Codex should:

1. Inspect the actual repository.
2. Compare the real implementation with this `CONTEXT.md`.
3. Mark outdated assumptions.
4. Update technical sections based on code.
5. Keep product sections unless contradicted by the product owner.
6. Verify Excel-derived formula, backlog, architecture, and data-source details against the latest planning file.
7. Create additional docs if needed:
   - `ARCHITECTURE.md`
   - `DATABASE.md`
   - `AI_PIPELINE.md`
   - `PREI.md`
   - `ROADMAP.md`
