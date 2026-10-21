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

`model-review.html` evaluates a real skin-weighted Microsoft Rocketbox Male_Adult_02 model (MIT) at one office workstation. The same model now supplies all five main-office employees. This is a more realistic candidate, not a recreation of the generated A illustration. The page includes desk/face/hands/side cameras, orbit/zoom, pause/reduced motion and an earlier procedural-model comparison at the same desk.

The 14 MiB GLB embeds five color/normal/alpha textures, 80 bones, three skinned primitives, two eyelid blendshapes, a keyed seated pose and a separate blink animation. Arm and leg targets are authored, not motion capture. It uses 2048px color maps and 1024px normal/alpha maps. Full attribution and the MIT license live in `public/assets/licenses/`. Asset-loading failures show an error, rather than silently substituting the earlier model.

Rebuild with Blender 4.3+ and verified sources:

```sh
python3 scripts/fetch_office_avatar_sources.py /tmp/office-avatar-source
blender -b -t 2 --python scripts/build_office_avatar.py -- --sources /tmp/office-avatar-source --output /tmp/office-seated.glb
```

The main office now loads the approved textured avatar once and clones five independent skeletons and animation mixers. Body materials have restrained per-employee color tints; geometry and textures are shared to avoid five asset downloads. The procedural people are retained only behind the explicit comparison button on model-review.html.
