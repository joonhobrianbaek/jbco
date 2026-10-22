# BB Office

A full-screen, interactive 3D office for five AI workspaces: GPT, Claude, Gemini, Muse and Copilot. GPT and Claude are the main workspaces, with larger front-center desks and highlighted roster entries; Gemini, Muse and Copilot provide supporting workspaces. Frosted rear glazing keeps the cutaway free of floating exterior scenery. The office includes individual desks, seated adult 3D staff, a glass meeting room, pantry and lounge. Drag to orbit, scroll to zoom, or reset the view. Animation can be paused and starts paused with reduced-motion preferences.

Requires Node.js 20 or later. No application dependency installation.

```sh
npm run check
npm test
npm start
```

The default port is 3000; override with `PORT=3001 npm start`. The `public/` directory deploys directly to GitHub Pages with relative asset URLs. WebGL 2 is required for the office; the task board remains available without it.

Click a desk or employee in the bottom roster to open its AI service in a new tab. The 업무 button opens the task board, where 업무 배정 creates a task. Assignments persist in this browser's localStorage using the existing `jbco-plays` key, preserving earlier tasks. They are not shared or backed up. Progress and completion are manual. **AI accounts and APIs are not connected; assignments are not sent to any provider.** Desk screens reflect saved assignment counts.

The BB brand image is the original BB_favicon_64x64.png from joonhobrianbaek/bb-favicon, copied unchanged to public/brand.png. Office geometry, materials and textures are generated locally. Three.js 0.186.1 is vendored under public/vendor with its MIT license; no external runtime fonts, scripts or images are required.

Earlier basketball motion experiments remain at `lab.html` for reference, separate from the office. Their assets, source attribution, reproduction scripts and eight regression tests are retained. See public/assets/licenses/credits.txt and the lab's asset-source link for licensing details.

## Work context and manual handoff

The task board includes five work categories and starter briefs for reconciliation, spot billing, labor analysis, forecasting/productivity and process automation. GPT and Claude remain flexible main agents; new general assignments and templates default to Claude. Existing browser tasks keep their IDs, owners and status, and appear under Other until newly categorized tasks are created.

“업무 맥락 · 협업 설정” holds an editable, browser-local summary (`jbco-context`). Public defaults contain only general work practices, with no company amounts, contacts or the uploaded source document. They are background guidance, not a verified live business record.

Each task's 인수인계 dialog stores results/files, checks/unknowns and next steps. Import .md/.txt notes up to 40KB as literal text; results are limited to 12,000 characters. Save changes the displayed owner and updates desk assignment counts while retaining the task status. Download exports the current draft and saved common context as OFFICE_HANDOFF.md for manual sharing with Claude or GPT; download alone does not save or transfer ownership. No provider is invoked, no instructions in imported text execute, and no cloud/account synchronization occurs. Closing a dialog without saving discards the draft. Browser storage errors are reported and cannot guarantee persistence.

The main view keeps branding to a small muted BB icon. Framed prints, lounge textiles and a warm reading lamp add detail without covering the office with introductory copy; collaboration controls stay inside the task board.

## AI service shortcuts

All five employees open the corresponding website with the user’s existing browser login: ChatGPT, Claude, Gemini, muse.ai and Microsoft Copilot. The task board’s AI 바로가기 설정 accepts personal HTTPS project/conversation links and stores them only in this browser (`jbco-services`). Defaults can be restored. No account credentials or API keys are collected.

이어서 작업 copies the task, saved common context and latest handoff as text and opens the current owner’s configured URL. Paste manually into the AI service. If clipboard access fails, a selected-text dialog supports manual copying with a reopen link. Popups may need to be allowed by the browser. Task content is never inserted into destination URLs. Conversations, provider task status and completed results do not automatically sync back to the office.

Staff use original stylized mini-character geometry: oversized expressive faces, larger bodies, sneakers and distinct hair/headphone/cap accessories. The office pairs lighter wood and walls with a lavender rug/sofa, shared beanbag seating, pastel pinboard and rounded desk/meeting-table footprints. Outfits follow the user-provided subscription grouping: GPT, Claude and Muse wear premium jackets with contrasting lapels and metallic accents; Gemini and Copilot wear neutral basic outfits. This is a visual preference, not a live account/billing check. The 직원 view control zooms toward the team, and the home control restores the room view. Existing service shortcuts and local workspaces are unchanged.

## Illustrated team closet

`characters.html` provides a 2D design-preview wardrobe with three illustrated outfit presets per employee (Soft, Street, After Hours). Each selection is independent and persists in `jbco-wardrobe`; resetting restores premium staff to After Hours and basic staff to Soft. The bundled generated artwork is displayed as individual portrait crops. Wardrobe selections are preview-only and do not change the office artwork yet. The office now uses an approved illustrated figure atlas rather than the earlier procedural human models.

The monitor selector defaults to Left Monitor (`jbco-display-layout`): on wide screens, the main GPT/Claude controls and illustrated portraits sit nearest the right edge, toward the center monitor. The office roster follows the same placement. Standard restores the regular order; smaller screens prioritize primary staff first to keep them reachable. Layout and outfit settings remain browser-local.

## Departments and project destinations

The bottom department dock opens workspaces for finance/reconciliation, labor/operations, purchasing/approvals and development/automation. Each workspace can save multiple named tasks with its own AI and HTTPS project/conversation URL in `jbco-projects`. Opening a project is a direct link without copying. 업무 기록 creates a local task linked to that workspace; 이어서 작업 copies its context and opens the saved project as long as its assigned AI still matches, otherwise the current AI service shortcut is used. Existing tasks remain intact.

Personal project addresses are not bundled in public code. A `#proposal=` setup link imports a Claude project URL into this browser, then clears the fragment; fragments are not included in website HTTP requests. This only configures a shortcut and does not authenticate, submit a request or grant access to a project.

The office’s original procedural people have been removed. Five transparent illustrated figures are now rendered as sprites in the 3D room, preserving the approved design and clothing. They are 2D artwork, not rigged animated 3D bodies; camera-facing poses gently move with the motion control. Loading the artwork is required before the office loading screen clears.

## Seated adult staff (A direction)

The main office now renders actual seated 3D people inspired by option A of people-study.html, replacing the illustrated standing sprites. This is a real-time interpretation with simpler geometry and materials, not a pixel-identical reproduction of the generated design study. Heads, facial features, swept hair, sleeves, hands/fingers and footwear are modeled in geometry; premium staff have knit bump detail and a subtle watch, with plain basics for the other staff. Characters sit in ergonomic chairs with hands over keyboards and small head/finger motions; reduced motion and pause remain supported.

Workstations are angled to expose seated side views, with open steel legs for clear lower-body silhouettes. The staff close-up uses 2.2× zoom; home restores the room. Static parts are merged by material within each animated group, keeping the five people near 100 meshes in total. The character atlas is no longer loaded. Department destinations, personal URLs, local tasks and left-monitor layout are retained.

## One-person textured model review

`model-review.html` evaluates a real skin-weighted Microsoft Rocketbox Male_Adult_02 model (MIT) at one office workstation. This model remains the single-person review reference; the main office uses distinct models described below. This is a more realistic candidate, not a recreation of the generated A illustration. The page includes desk/face/hands/side cameras, orbit/zoom, pause/reduced motion and an earlier procedural-model comparison at the same desk.

The 14 MiB GLB embeds five color/normal/alpha textures, 80 bones, three skinned primitives, two eyelid blendshapes, a keyed seated pose and a separate blink animation. Arm and leg targets are authored, not motion capture. It uses 2048px color maps and 1024px normal/alpha maps. Full attribution and the MIT license live in `public/assets/licenses/`. Asset-loading failures show an error, rather than silently substituting the earlier model.

Rebuild with Blender 4.3+ and verified sources:

```sh
python3 scripts/fetch_office_avatar_sources.py /tmp/office-avatar-source
blender -b -t 2 --python scripts/build_office_avatar.py -- --sources /tmp/office-avatar-source --output /tmp/office-seated.glb
```

The earlier shared-avatar implementation has been superseded by the distinct team below. The procedural people are retained only behind the explicit comparison button on model-review.html.

## Distinct team and private office

The main office now uses five different licensed Rocketbox source models for the AI staff, plus a sixth Business_Male_02 model for the owner. Source IDs and file checksums are in `scripts/team-avatar-sources.json`; full model mapping and MIT attribution are in `public/assets/licenses/team-avatar-credits.txt`. The owner has a swept-back scalp and navy suit as requested, representing a style rather than a photo-based likeness. Each rig's seated leg and arm targets account for its own segment lengths. Six web-optimized assets total about 16 MiB, comparable to the previous single unoptimized model.

A private glass office extends the right-hand side without removing the meeting room or lounge. It includes a wider desk, three monitors, visitor seating, cabinetry and plants. `내 방` frames the private office; `나` frames the owner avatar; clicking the owner's desk also frames the private office. The normal room view is reframed for the extension. Staff/project links and browser-local work records remain unchanged. The one-person model-review page retains the earlier reference model.

Rebuild any team member after fetching sources:

```sh
python3 scripts/fetch_team_avatar_sources.py /tmp/office-team-source
blender -b -t 2 --python scripts/build_office_avatar.py -- --sources /tmp/office-team-source/Business_Male_02 --model Business_Male_02 --web --slickback --output /tmp/owner.glb
```

Use each mapped source directory/model for other staff; omit `--slickback` except for the owner.

## Lounge and collaboration room

Three additional lounge guests reuse the team's licensed rigs without new downloads. They converse, read a physical book, or play a handheld game on a beanbag. Arm targets use the existing bone lengths; head/gesture motion and blinks pause with the office controls and reduced-motion preference. The sofa now faces the coffee table.

`회의` or clicking the meeting room opens a browser-local collaboration board. Two to four distinct text AI participants can have separate roles and actual pasted results. Their existing avatars move from their desks into opposing meeting seats; removing a participant restores their desk position. GPT and Claude are the default pair. Muse remains available through its regular video-service shortcut rather than being presented as a conversational text model.

Write a shared objective, optionally choose an existing department project, and use an AI's copy/open button. Paste the prepared context into that service, then paste its real answer back into the board. Each next brief includes registered results from the other participants, their roles, and the owner's decision. Matching project links are used for that project's provider; other participants use configured service links. Clipboard failure exposes selectable text. Results, roles and decisions persist in `jbco-meeting`; Markdown export provides a portable record. No model output or execution status is fabricated. This version does not send requests to model APIs or read answers from logged-in service tabs. Automated API collaboration would require an authenticated backend with server-side keys and usage controls; GitHub Pages hosts only the current static frontend.

Validated in Chromium: three lounge guests, moving meeting participants, cross-provider context, minimum two participants, browser persistence, Markdown download, responsive dialog and absence of page errors.

Lounge seating uses a separate two-bone leg solve rather than the workstation pose. Each actor retains its actual thigh/calf lengths, knees project beyond the furniture front, and ankle targets sit 12 cm above the floor to allow for the shoe geometry. The sofa occupants sit nearer the cushion edge; the occupied beanbag has a lower seat and its back follows the guest's facing direction. Browser checks cover all six ankles, knee clearance, and pose stability while gestures/blinks play.

## AI departments, employees and chief of staff (current)

AI provider IDs now identify departments rather than individual actors. `public/employees.js` defines nine unique employees: three each in GPT and Claude, and one each in Gemini, Copilot and Muse. Each main department has three different source faces and roles. The 3D actors, desk project links, task assignments and department cards use stable employee IDs while existing saved tasks/projects/meetings retain their provider IDs. Old department-level tasks count against one representative, not every colleague. Employee tasks retain their department; handoff updates both identifiers. No additional model downloads are needed.

Six workstations sit in the shared office and Muse has a smaller desk next to the owner. The two lounge guests are actual GPT/Claude employees. Meeting representatives move their existing rigs into meeting seats, so the one-person free teams are never duplicated between locations. Department cards list staff roles and open matching configured project links; 업무 분야 projects remain available in the task sidebar. This is visual staffing and manual work routing, not extra subscriptions or concurrent model execution.

Muse is a single chief of staff. Its board stores the owner's priorities locally in `jbco-chief-notes`, lists actual unfinished tasks, and links to GPT/Claude departments, the meeting room, task board and the existing Muse.ai video-service destination. It does not claim that Muse.ai generates text, reads private chats, or autonomously coordinates other providers.

The left wall has one Mona Lisa and one Basquiat Self-Portrait, each rendered using a local image at its original aspect ratio. Artist/source/rights information is in `public/assets/licenses/mona-lisa-credits.txt` and `basquiat-credits.txt`; the Basquiat artwork is not covered by the code or avatar licenses.

Validation includes employee/team count and legacy task attribution tests, plus Chromium checks for project-specific staff links, per-employee assignment, chief notes and task listing, restoring stored data, meeting moves without cloning, responsive cards, loaded artwork textures and grounded lounge legs.

## Team navigation and Mona Lisa dashboard

Floating head-height staffing signs have been removed. Muted floor zones, inlaid names in the aisles, and small brass-colored plates attached to the desks identify departments. Clicking a zone/name opens that department's existing staff/task controls; Muse opens the chief-of-staff board. Pointer hover strengthens the matching floor outline. Employee desk clicks retain their project/service routing.

The Mona Lisa frame opens `대표 대시보드`: recorded total/queued/active/done task counts, department headcounts and unfinished work, the chief's current owner note, and links to departments, the chief, meeting room and complete work board. All counts come from existing local work records, with empty states when none exist. The work sidebar has a keyboard-accessible dashboard shortcut as well. Basquiat remains a painting rather than another navigation control. Browser validation covers picking each floor label, selecting the painting, actual task counts and dashboard destinations, responsive layout and preservation of the nine existing employees.

## Open office, camera fit and bounded movement

The opaque exterior walls are removed. Art and the pinboard stand on floor-mounted frames, the pantry shelves have supports, and the owner's low cabinet keeps its identity without a tall rear wall. Interior partitions use lighter glass. Horizontal orbit remains unrestricted, so the back of the office can be inspected too.

Overview/reset fits the actual L-shaped office footprint into the space between the header, footer and right-hand controls. It chooses an elevation for the viewport aspect ratio, then fits and centers the orthographic view. Resizing recomputes this overview; manual orbit and close-up views keep their chosen framing.

Staff hands now use separate desk, mouse, lap, book and meeting poses with actual arm lengths and retained palm orientation. Working staff feet are also grounded. `staff-motion.js` serializes movement to one actor at a time: rise, walk along fixed aisles, and sit. Meeting participant changes queue real rig movement instead of teleporting the actor. The glass door opens during meeting transfers. One lounge employee occasionally moves between the sofa and the empty beanbag. Pausing, reduced-motion mode and hidden tabs stop the visual clock. These are visual staff routines; they do not submit AI work or invent model execution status.

Navigation tests sample routes from all shared workstations to every meeting seat against padded table footprints. Browser checks cover real skinned walking/returning and lounge round trips, floor contact, queued transitions, pause, multiple viewport fits, reverse orbit, correct team picking and the Mona Lisa dashboard.

Overview rotation now continuously recenters the projected office bounds within the usable screen area and refits scale for the current angle. The previous overview correction was only applied on reset, so rotating around that offset target could shift the office to one side. Wheel/middle-button zoom keeps the chosen scale while preserving centering; explicit right-button pan and dedicated room/face closeups retain their manual framing. Browser checks cover four orbit angles, manual zoom and returning from a room closeup.

## Autonomous office runtime

The `자율 업무` button opens real server-backed delegation and a CEO approval inbox. Muse is the office chief-of-staff role, implemented using the Claude API; muse.ai is not an LLM API. The runtime plans 2–3 assignments across GPT and Claude employees, executes them sequentially with colleague context, performs GPT cross-review, and asks Claude to synthesize a report. Only the human can approve or request revision. Approval records acceptance; it never sends, purchases, submits, deploys, deletes, or invokes tools. There is no browser automation, internet research tool, scheduler, or access to private web projects. Supply necessary source material explicitly.

GitHub Pages hosts the UI only. Run `node --env-file=.env server.mjs` on an always-on Node 20+ server with persistent private storage and HTTPS in front. Copy `.env.example` to `.env`, set both API keys and model IDs supported by your accounts, generate `OFFICE_RUNTIME_TOKEN` with `openssl rand -hex 32`, and set exact comma-separated UI origins in `OFFICE_ALLOWED_ORIGINS` (no trailing slash). Never commit credentials or put them in public files. Use a private single-owner deployment: the bearer token grants read access to all reports and approval authority. This is not a multi-user authentication system. Do not publicly expose the unencrypted Node port; use an HTTPS reverse proxy. For same-origin operation include the actual UI origin in the allowlist too.

Open `자율 업무 → 실행 서버 연결`, enter the HTTPS server origin and its connection token. The URL is stored locally; token stays only in page memory. API keys stay on the server. An unconnected Pages UI clearly remains disabled. Work continues while the page is closed, provided the server stays running. Runtime history is JSON on `OFFICE_DATA_DIR`, outside the public static root; retain/back up this private disk. Interrupted in-flight jobs are marked failed at restart rather than silently replayed or charged again.

Limits: one active job, 2–3 delegated workers, maximum 12 API calls per job including at most two CEO revisions, 1,800 output tokens per call, 90-second provider timeout. There are no automatic retries. These are usage limits, not a dollar budget; set provider-side spending limits for monetary control. Workers cannot autonomously add tools, spawn unbounded agents, or approve their own output. Source text and model replies are rendered as text, not HTML. Provider failures preserve completed work and surface a failed status. A failed run is not automatically resumed. Local unit tests use injected mock providers; passing them does not prove live API connectivity.

A non-root `Dockerfile` is included for container hosts. Build with `docker build -t bb-office .` and run with your secret environment injected, a persistent writable volume mounted at `/data`, and port 3000 behind HTTPS. The image copies only the runtime and public frontend; `.env` and private history are excluded. No server has been provisioned or API credentials installed by this change.

### Managed server deployment

[Deploy the reviewed Render Blueprint](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fjoonhobrianbaek%2Fjbco) using `render.yaml`. This provisions a **paid Starter Node service plus a 1GB persistent disk**; review current hosting charges before creation. Both providers' API charges are separate. The Blueprint generates the owner token; supply provider keys and model IDs as private environment values. `/healthz` is a public readiness endpoint that only reports whether the server and private history store initialized, without exposing reports, keys, or provider configuration. Private API routes remain authenticated. See [Korean deployment and connection guide](docs/RUNTIME_SETUP.ko.md). No hosting account or cloud resource is created just by committing these files.

### Default: existing web subscriptions, no API runtime

The office now opens `업무 지휘` as its default workflow. It uses the existing GPT/Claude web accounts, configured safe service URLs and matching project links. Five manual handoffs cover planning (Claude acting as chief), GPT analysis, Claude draft, GPT review and Claude final report. Each step copies a contextual prompt and opens the appropriate website; only an actual pasted reply advances the workflow. Clipboard failures expose a selectable prompt. Results/drafts persist locally, can be exported, and only the human records final approval or requests a revision loop. Muse.ai remains a video service and is not used as a text model. No server, API key, polling, or provider API request is used by this default flow. The optional API backend source and deployment configuration remain available but are not loaded or provisioned by this UI. Browser storage and existing web subscription limits still apply.

### Lightweight office and report waitlist

The default page now uses an illustrated 2D office and one transparent six-character atlas derived from the approved face/lean-body concepts. It does not import Three.js, create a WebGL canvas, download GLBs, or run a permanent rendering loop. The previous 3D view remains an explicit `3D 보기` option (`?view=3d`); returning to the lightweight view reloads the page to release its renderer and model allocations. The low-load default applies even if an old office-version query is present.

Actual pasted web-workflow replies create a FIFO report waitlist: intermediate results go to the chief, the current final report awaits CEO approval. One messenger at a time travels to the relevant room and waits for acknowledgement; no idle crowd simulation runs. Reading/acknowledging a report is separate from approving its result, which remains in the work command dialog. Acknowledgements are local and survive reloads. Approved or superseded final approvals are removed from the pending queue. Text in speech bubbles describes the handoff; report bodies show actual supplied replies, never invented model conversations. Movement is finite, pauses when the tab is hidden, and is omitted for reduced motion/mobile while the same waitlist remains usable. With no server/API connection, replies still must be brought back from the existing GPT/Claude websites manually.

### Low-power 3D room with approved 2D characters

The default view is now `hybrid`: a real, rotatable Three.js office built from simple geometry, with the approved illustrated crew on camera-facing upright planes. The people are 2D billboards, not newly authored volumetric character models. One shared atlas provides all characters; no GLB models, skeletal rigs, mixers or legacy `office.js` are loaded. Pixel ratio is capped at 1, shadows and antialiasing are disabled, and rendering is event-driven with a maximum 24 frames/second while interacting or moving a messenger. Idle scenes have no repeating render loop. Hidden tabs stop rendering and pause motion time. FIFO reports and CEO approval use the same persisted workflow/acknowledgements in both views. The `2D 절전 화면` button (`?view=light`) still provides the zero-WebGL option, with a full reload on switching to release old GPU resources. Company daily automation remains unconfigured and inactive.

### User-supplied chubby 3D pilot

`assets/crew/flame-buddy-seated.glb` adapts the user's uploaded floor-seated Meshy model for one office chair, initially GPT analysis. The original 11,077,712-byte/219,334-triangle source has no skin or animation and remains outside the public directory. `scripts/build_chubby_office.py` retains the imported upper-body artwork, removes the baked blue floor cushion/feet, adds short trouser legs and shoes with separate rigid thigh/shin nodes, and reduces the web asset to about 1MB/29,176 triangles with embedded maps capped at 1024px. This is a rigid-part pose adaptation, not a newly skinned animation rig. The avatar sits at its desk, uses a simple standing leg cycle during actual report handoffs, and returns to its seated pose. Existing characters are not all replaced with identical copies. Rendering still stops at idle. If loading fails the previous illustration stays available. `buddy.html` provides a standalone seated/standing 3D review, and the office's `새 모델` button focuses the pilot employee.
