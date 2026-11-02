# Graph Report - HiLaw  (2026-11-02)

## Corpus Check
- 110 files · ~50,153 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .example 2, (none) 2, .pptx 1)

## Summary
- 765 nodes · 1635 edges · 45 communities (34 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6190008e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TypeScript Compiler Config
- HiLaw API - Express + Supabase
- Package & ESLint Configuration
- api
- check
- PublicWebsite.tsx
- react
- File SVG Asset
- Globe SVG Asset
- Next.js SVG Asset
- Vercel SVG Asset
- Window SVG Asset
- validators/index.ts
- controllers/index.ts
- backend/package.json
- create-admin.mjs
- ref_node_assert
- app.ts
- load-ts.cjs
- verification.test.cjs
- test-admin-customers.mjs
- compilerOptions
- auth-navigation.test.cjs
- directory.test.cjs
- auth.test.cjs
- Deploy HiLaw ke Vercel
- scripts
- dependencies
- .prettierrc.json
- 004_points_chat.sql
- BackendAuthProvider.tsx
- api.ts
- AdminExperience.tsx
- CoinProvider.tsx
- Dashboard
- ConsultationDetail.tsx
- routes/index.ts
- 006_midtrans_topup.sql
- AuthForm
- avatar.test.ts

## God Nodes (most connected - your core abstractions)
1. `check()` - 45 edges
2. `ApiError` - 41 edges
3. `ok()` - 35 edges
4. `api()` - 30 edges
5. `react` - 29 edges
6. `public.profiles` - 21 edges
7. `next` - 20 edges
8. `useAuth()` - 20 edges
9. `useCoins()` - 18 edges
10. `Modal()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `6. Integrasi frontend dan fitur yang masih mock` --references--> `BackendProfile()`  [INFERRED]
  backend/README.md → src/components/auth/BackendProfile.tsx
- `6. Integrasi frontend dan fitur yang masih mock` --references--> `BackendVerification()`  [INFERRED]
  backend/README.md → src/components/operations/BackendVerification.tsx
- `6. Integrasi frontend dan fitur yang masih mock` --references--> `BackendAdminVerifications()`  [INFERRED]
  backend/README.md → src/components/operations/BackendVerification.tsx
- `6. Integrasi frontend dan fitur yang masih mock` --references--> `CoinProvider()`  [INFERRED]
  backend/README.md → src/store/CoinProvider.tsx
- `6. Integrasi frontend dan fitur yang masih mock` --references--> `AppAuthProvider()`  [INFERRED]
  backend/README.md → src/components/auth/AppAuthProvider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **HiLaw 3-Role Consultation & LawToken Architecture** — prd_client_role, prd_lawyer_role, prd_admin_role, prd_lawtoken_system, docs_erd_and_mock_schema_typescript_contracts [EXTRACTED 1.00]

## Communities (45 total, 11 thin omitted)

### Community 0 - "TypeScript Compiler Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "HiLaw API - Express + Supabase"
Cohesion: 0.08
Nodes (24): 1. Instalasi dan konfigurasi, 1. Jalankan migration 004 (wajib, sekali), 1b. Jalankan migration 005 (paket sesi & batas waktu), 2. Aturan Poin, 2. SQL Supabase dan private bucket, 3. Akun Admin pertama, 3. Endpoint baru, 4. Mengaktifkan Gemini untuk chatbot (+16 more)

### Community 2 - "Package & ESLint Configuration"
Cohesion: 0.08
Nodes (32): eslintConfig, dependencies, lucide-react@^1.60.0, next@16.4.2, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+24 more)

### Community 3 - "api"
Cohesion: 0.16
Nodes (21): BackendProfile(), remove(), save(), AdminCustomers(), refresh(), remove(), Customer, CustomerList (+13 more)

### Community 4 - "check"
Cohesion: 0.08
Nodes (65): authClient(), database, KTA_BUCKET, options, authenticate(), roles(), currentUser(), refreshSession() (+57 more)

### Community 5 - "PublicWebsite.tsx"
Cohesion: 0.09
Nodes (27): Page(), Content(), Page(), Page(), Page(), Answer, Chatbot(), Message (+19 more)

### Community 6 - "react"
Cohesion: 0.14
Nodes (18): nextConfig, lucide-react, next, react, AuthFormFields(), AuthContextValue, AuthRole, dashboardPath() (+10 more)

### Community 12 - "validators/index.ts"
Cohesion: 0.09
Nodes (24): booking, chatbot, consultationStatus, customerDeletion, customerQuery, deletion, email, fullName (+16 more)

### Community 13 - "controllers/index.ts"
Cohesion: 0.07
Nodes (47): adminTransactions(), approve(), book(), chatbot(), consultation(), deleteCustomer(), deleteProfile(), lawyerReviews() (+39 more)

### Community 14 - "backend/package.json"
Cohesion: 0.12
Nodes (21): devDependencies, prettier@^3.0.0, tsx@^4.0.0, @types/cors@^2.8.17, @types/express@^5.0.0, @types/multer@^2.0.0, @types/node@^22.0.0, typescript@^5.0.0 (+13 more)

### Community 15 - "create-admin.mjs"
Cohesion: 0.12
Nodes (15): dotenv@^17.0.0, @supabase/supabase-js@^2.0.0, db, auth, db, email, options, db (+7 more)

### Community 16 - "ref_node_assert"
Cohesion: 0.13
Nodes (11): headers, server, auth, midtransStatus, rpcCalls, server, calls, input (+3 more)

### Community 17 - "app.ts"
Cohesion: 0.20
Nodes (10): express@^5.0.0, zod@^4.0.0, app, env, result, schema, errorHandler(), server (+2 more)

### Community 18 - "load-ts.cjs"
Cohesion: 0.14
Nodes (9): cache, fs, loadTS(), path, ts, vm, assert, { earnings, toConsultation } (+1 more)

### Community 19 - "verification.test.cjs"
Cohesion: 0.14
Nodes (9): save(), assert, { File }, fs, harness(), text(), test, ts (+1 more)

### Community 20 - "test-admin-customers.mjs"
Cohesion: 0.14
Nodes (10): createdIds, server, paths, png, server, account(), call(), created (+2 more)

### Community 21 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, module, moduleResolution, noUncheckedIndexedAccess, outDir, rootDir, skipLibCheck (+3 more)

### Community 22 - "auth-navigation.test.cjs"
Cohesion: 0.18
Nodes (7): assert, fs, harness(), find(), test, ts, vm

### Community 23 - "directory.test.cjs"
Cohesion: 0.18
Nodes (8): assert, fs, harness(), all(), walk(), test, ts, vm

### Community 24 - "auth.test.cjs"
Cohesion: 0.20
Nodes (7): assert, fs, profile, session, test, ts, vm

### Community 25 - "Deploy HiLaw ke Vercel"
Cohesion: 0.06
Nodes (35): AGENTS.md Project Ruleset, AGY Ready-to-Use Prompts, Antigravity CLI + Ponytail + Graphify Setup, 0. Persiapan (sekali), 1. Deploy backend (`hilaw-api`), 2. Deploy frontend (`hilaw`), 3. Sambungkan CORS (kembali ke backend), 3b. Webhook Midtrans (+27 more)

### Community 26 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, create-admin, dev, format, start, test, typecheck

### Community 27 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, cors@^2.8.5, express-rate-limit@^8.0.0, helmet@^8.0.0, cors, express-rate-limit, helmet

### Community 29 - "004_points_chat.sql"
Cohesion: 0.07
Nodes (46): lawyer_profiles_updated, lawyer_status_idx, on_auth_email_updated, on_auth_user_created, one_pending_per_lawyer, profiles_role_idx, profiles_updated, public.handle_new_user() (+38 more)

### Community 30 - "BackendAuthProvider.tsx"
Cohesion: 0.15
Nodes (18): 6. Integrasi frontend dan fitur yang masih mock, jakarta, metadata, RootLayout(), AppAuthProvider(), AuthContext, DemoUser, BackendAuthProvider() (+10 more)

### Community 31 - "api.ts"
Cohesion: 0.29
Nodes (10): DocumentButton(), load(), OwnData, API_URL, ApiLawyer, ApiProfile, openDocument(), refreshAccess() (+2 more)

### Community 32 - "AdminExperience.tsx"
Cohesion: 0.20
Nodes (18): ConsultationList(), Consultations(), CustomerExperience(), localDate(), Status(), TopUp(), TransactionTable(), Operations() (+10 more)

### Community 33 - "CoinProvider.tsx"
Cohesion: 0.14
Nodes (24): Detail, Thread, loadSnap(), PaymentConfig, SnapCallbacks, payWithMidtrans(), Window, ApiConsultation (+16 more)

### Community 34 - "Dashboard"
Cohesion: 0.16
Nodes (11): Page(), Content(), Page(), sections, Content(), Page(), sections, Content() (+3 more)

### Community 35 - "ConsultationDetail.tsx"
Cohesion: 0.38
Nodes (4): Content(), Page(), ConsultationDetail(), ReviewForm()

### Community 36 - "routes/index.ts"
Cohesion: 0.32
Nodes (6): multer@^2.0.0, upload, uploadProfilePhoto, authLimit, routes, multer

### Community 41 - "006_midtrans_topup.sql"
Cohesion: 0.70
Nodes (4): public.settle_topup_order(), public.topup_orders, topup_orders_updated, topup_orders_user_idx

### Community 42 - "AuthForm"
Cohesion: 0.60
Nodes (3): Page(), Page(), AuthForm()

### Community 43 - "avatar.test.ts"
Cohesion: 0.50
Nodes (3): actor, patch, removed

## Knowledge Gaps
- **11 isolated node(s):** `Vercel Logo SVG`, `Window Icon SVG`, `LawyerCard Component Spec (Halodoc Style)`, `Level 3: Admin Operasional`, `Business Model Lean Canvas (BMLC) Mapping` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 275 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `save()` connect `verification.test.cjs` to `ConsultationDetail.tsx`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **What connects `Vercel Logo SVG`, `Window Icon SVG`, `LawyerCard Component Spec (Halodoc Style)` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript Compiler Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `HiLaw API - Express + Supabase` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Package & ESLint Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.0766488413547237 - nodes in this community are weakly interconnected._
- **Should `check` be split into smaller, more focused modules?**
  _Cohesion score 0.07659850697825381 - nodes in this community are weakly interconnected._
- **Should `PublicWebsite.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09103840682788052 - nodes in this community are weakly interconnected._