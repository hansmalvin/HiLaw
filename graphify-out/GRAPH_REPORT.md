# Graph Report - HiLaw  (2026-10-20)

## Corpus Check
- 25 files · ~18,708 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .pptx 1, .ico 1)

## Summary
- 135 nodes · 236 edges · 13 communities (7 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7cb74b4f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TypeScript Compiler Config
- HiLaw Architecture & PRD Specs
- Package & ESLint Configuration
- Next.js App Router Core
- Dev Dependencies
- Runtime Dependencies
- NPM Scripts
- File SVG Asset
- Globe SVG Asset
- Next.js SVG Asset
- Vercel SVG Asset
- Window SVG Asset
- Next.js README

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `useHiLaw()` - 15 edges
3. `react` - 12 edges
4. `HiLawContextType` - 10 edges
5. `lucide-react` - 7 edges
6. `HomePage()` - 6 edges
7. `AdminDashboardView()` - 6 edges
8. `ConsultationWorkspace()` - 6 edges
9. `LawyerDashboardView()` - 6 edges
10. `HiLaw LegalTech Platform` - 6 edges

## Surprising Connections (you probably didn't know these)
- `MidtransSnapModal Component Spec` --implements--> `LawToken Payment System (1 Token = Rp 1.000)`  [INFERRED]
  docs/DESIGN_SYSTEM.md → PRD.md
- `TypeScript Contracts (src/types/hilaw.ts)` --shares_data_with--> `LawToken Payment System (1 Token = Rp 1.000)`  [INFERRED]
  docs/ERD_AND_MOCK_SCHEMA.md → PRD.md
- `AGENTS.md Project Ruleset` --references--> `Antigravity CLI + Ponytail + Graphify Setup`  [EXTRACTED]
  AGENTS.md → docs/ANTIGRAVITY_SETUP.md
- `AGENTS.md Project Ruleset` --references--> `Pastel Legal Trust Design System`  [EXTRACTED]
  AGENTS.md → docs/DESIGN_SYSTEM.md
- `AGENTS.md Project Ruleset` --references--> `HiLaw 6-Table ERD & Mock Schema`  [EXTRACTED]
  AGENTS.md → docs/ERD_AND_MOCK_SCHEMA.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **HiLaw 3-Role Consultation & LawToken Architecture** — prd_client_role, prd_lawyer_role, prd_admin_role, prd_lawtoken_system, docs_erd_and_mock_schema_typescript_contracts [EXTRACTED 1.00]

## Communities (13 total, 6 thin omitted)

### Community 0 - "TypeScript Compiler Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "HiLaw Architecture & PRD Specs"
Cohesion: 0.15
Nodes (16): AGENTS.md Project Ruleset, AGY Ready-to-Use Prompts, Antigravity CLI + Ponytail + Graphify Setup, LawyerCard Component Spec (Halodoc Style), MidtransSnapModal Component Spec, Pastel Legal Trust Design System, HiLaw 6-Table ERD & Mock Schema, TypeScript Contracts (src/types/hilaw.ts) (+8 more)

### Community 2 - "Package & ESLint Configuration"
Cohesion: 0.08
Nodes (23): eslintConfig, dependencies, lucide-react, next, react, react-dom, name, private (+15 more)

### Community 3 - "Next.js App Router Core"
Cohesion: 0.22
Nodes (8): nextConfig, next, jetbrainsMono, metadata, plusJakarta, RootLayout(), MidtransSnapModal(), HiLawProvider()

### Community 4 - "Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/turbopack, @types/node, @types/react, @types/react-dom (+1 more)

### Community 5 - "Runtime Dependencies"
Cohesion: 0.19
Nodes (23): PAYMENT_CHANNELS, HiLawContext, HiLawContextType, LEGAL_TRIAGE_CASES, MOCK_LAWYERS, MOCK_MESSAGES, MOCK_SESSIONS, MOCK_TOKEN_PACKAGES (+15 more)

### Community 6 - "NPM Scripts"
Cohesion: 0.27
Nodes (12): lucide-react, react, AdminPage(), ConsultationPage(), LawyerDashboardPage(), HomePage(), AdminDashboardView(), ClientView() (+4 more)

## Knowledge Gaps
- **19 isolated node(s):** `react-dom`, `@tailwindcss/turbopack`, `@types/node`, `@types/react`, `@types/react-dom` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `NPM Scripts` to `Package & ESLint Configuration`, `Runtime Dependencies`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **What connects `react-dom`, `@tailwindcss/turbopack`, `@types/node` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript Compiler Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `Dev Dependencies` to `Package & ESLint Configuration`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `HiLaw Architecture & PRD Specs` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Next.js App Router Core` to `Package & ESLint Configuration`, `NPM Scripts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Package & ESLint Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._