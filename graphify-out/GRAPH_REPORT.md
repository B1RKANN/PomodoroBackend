# Graph Report - .  (2026-05-25)

## Corpus Check
- Corpus is ~7,309 words - fits in a single context window. You may not need a graph.

## Summary
- 274 nodes · 375 edges · 26 communities (15 shown, 11 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Authentication Domain|Authentication Domain]]
- [[_COMMUNITY_Socket Infrastructure|Socket Infrastructure]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Pomodoro Analytics|Pomodoro Analytics]]
- [[_COMMUNITY_HTTP App Wiring|HTTP App Wiring]]
- [[_COMMUNITY_Test Tooling|Test Tooling]]
- [[_COMMUNITY_Task Domain|Task Domain]]
- [[_COMMUNITY_Auth And Pomodoro Tests|Auth And Pomodoro Tests]]
- [[_COMMUNITY_Protected Controllers|Protected Controllers]]
- [[_COMMUNITY_Data Repositories|Data Repositories]]
- [[_COMMUNITY_Realtime Room Client|Realtime Room Client]]
- [[_COMMUNITY_Room Domain|Room Domain]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_CI And Deployment|CI And Deployment]]
- [[_COMMUNITY_Mongo Test Setup|Mongo Test Setup]]
- [[_COMMUNITY_Health Route|Health Route]]
- [[_COMMUNITY_Pomodoro Controller|Pomodoro Controller]]
- [[_COMMUNITY_Room Controller|Room Controller]]
- [[_COMMUNITY_Task Controller|Task Controller]]
- [[_COMMUNITY_Pomodoro Repository|Pomodoro Repository]]
- [[_COMMUNITY_Task Repository|Task Repository]]
- [[_COMMUNITY_User Repository|User Repository]]
- [[_COMMUNITY_Auth Service|Auth Service]]
- [[_COMMUNITY_Pomodoro Service|Pomodoro Service]]
- [[_COMMUNITY_Task Service|Task Service]]

## God Nodes (most connected - your core abstractions)
1. `TaskRepository` - 11 edges
2. `AuthService` - 11 edges
3. `ITask` - 10 edges
4. `TaskService` - 10 edges
5. `compilerOptions` - 9 edges
6. `PomodoroService` - 9 edges
7. `IUser` - 8 edges
8. `UserRepository` - 8 edges
9. `Task Model` - 8 edges
10. `User Model` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Deploy To VPS Job` --shares_data_with--> `Environment Config`  [EXTRACTED]
  .gitlab-ci.yml → src/config/env.ts
- `Test Client Room UI` --conceptually_related_to--> `Room Listing API`  [INFERRED]
  test-client/index.html → src/routes/room.routes.ts
- `Test Client Auth UI` --references--> `AuthService.register`  [INFERRED]
  test-client/index.html → src/services/auth.service.ts
- `Test Client Auth UI` --references--> `AuthService.login`  [INFERRED]
  test-client/index.html → src/services/auth.service.ts
- `Test Client Room UI` --references--> `Socket Room Management Events`  [EXTRACTED]
  test-client/index.html → src/socket/socket.service.ts

## Hyperedges (group relationships)
- **Authenticated User Scoped Flow** — auth_middleware_requireAuth, auth_request_user, task_controller_create, pomodoro_controller_record, pomodoro_controller_summary [EXTRACTED 1.00]
- **Room Listing Privacy Contract** — room_controller_spec_listing, room_controller_list, model_room [EXTRACTED 1.00]
- **CI Build Test Deploy Flow** — gitlab_ci_install_and_build, gitlab_ci_run_tests, gitlab_ci_deploy_to_vps, package_scripts [EXTRACTED 1.00]
- **Authenticated API Flow** — auth_service_generate_access_token, auth_middleware_socket_auth, pomodoro_routes_pomodoro_api, task_routes_task_api [INFERRED 0.85]
- **Collaborative Room Socket Flow** — socket_service_room_management_events, socket_service_chat_events, socket_service_timer_events, socket_service_status_events, index_socket_test_client [EXTRACTED 1.00]
- **Productivity Summary Flow** — pomodoro_service_record_session, pomodoro_service_summary, task_service_complete, pomodoro_service_spec_summary_tests [INFERRED 0.85]

## Communities (26 total, 11 thin omitted)

### Community 0 - "Authentication Domain"
Cohesion: 0.14
Nodes (9): AuthController, IUser, UserSchema, UserRepository, authController, router, AuthService, repo (+1 more)

### Community 1 - "Socket Infrastructure"
Cohesion: 0.13
Nodes (16): connectDB(), config, options, swaggerSpec, AuthenticatedSocket, authMiddleware(), router, activeTimers (+8 more)

### Community 2 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (23): author, dependencies, bcrypt, cors, dotenv, express, jsonwebtoken, mongoose (+15 more)

### Community 3 - "Pomodoro Analytics"
Cohesion: 0.13
Nodes (13): IPomodoroSession, PomodoroSessionSchema, PomodoroRepository, fmtIstanbul(), istanbulEndOfDay(), istanbulStartOfDay(), istanbulYmd(), PomodoroService (+5 more)

### Community 4 - "HTTP App Wiring"
Cohesion: 0.13
Nodes (20): Express HTTP Server, Socket.IO Server, AuthController, AuthController.login, AuthController.refreshToken, AuthController.register, requireAuth Middleware, AuthRequest.user (+12 more)

### Community 5 - "Test Tooling"
Cohesion: 0.10
Nodes (20): devDependencies, jest, mongodb-memory-server, node-fetch, nodemon, ts-jest, ts-node, @types/bcrypt (+12 more)

### Community 6 - "Task Domain"
Cohesion: 0.18
Nodes (5): ITask, TaskSchema, TaskRepository, service, TaskService

### Community 7 - "Auth And Pomodoro Tests"
Cohesion: 0.20
Nodes (18): AuthService.generateAccessToken, AuthService.generateRefreshToken, AuthService.login, AuthService.refreshToken, AuthService.register, Auth Flow Tests, Test Client Auth UI, Jest In-Memory Mongo Setup (+10 more)

### Community 8 - "Protected Controllers"
Cohesion: 0.18
Nodes (10): PomodoroController, userId, TaskController, userId, AuthRequest, requireAuth(), controller, router (+2 more)

### Community 9 - "Data Repositories"
Cohesion: 0.12
Nodes (17): PomodoroSession Model, Task Model, User Model, PomodoroRepository.create, PomodoroRepository.findByUserInRange, PomodoroRepository.sumDurationByUser, TaskRepository.complete, TaskRepository.countCompletedByUser (+9 more)

### Community 10 - "Realtime Room Client"
Cohesion: 0.17
Nodes (16): AuthenticatedSocket, Socket Auth Middleware, Test Client Chat UI, Test Client Room UI, Pomodoro Socket Test Client, Test Client Timer UI, Room Listing API, Active Timers Map (+8 more)

### Community 11 - "Room Domain"
Cohesion: 0.19
Nodes (10): payload, RoomController, controller, res, IParticipant, IRoom, RoomSchema, RoomType (+2 more)

### Community 12 - "TypeScript Config"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 13 - "CI And Deployment"
Cohesion: 0.27
Nodes (10): Deploy To VPS Job, Install And Build Job, GitLab CI Pipeline, Run Tests Job, Jest Configuration, Room Model, Package Scripts, RoomController.list (+2 more)

## Knowledge Gaps
- **120 isolated node(s):** `name`, `version`, `main`, `start`, `build` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TaskService` connect `Task Domain` to `Protected Controllers`, `Pomodoro Analytics`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `PomodoroService` connect `Pomodoro Analytics` to `Protected Controllers`, `Task Domain`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `config` connect `Socket Infrastructure` to `Protected Controllers`, `Authentication Domain`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `version`, `main` to the rest of the system?**
  _120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication Domain` be split into smaller, more focused modules?**
  _Cohesion score 0.14153846153846153 - nodes in this community are weakly interconnected._
- **Should `Socket Infrastructure` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._