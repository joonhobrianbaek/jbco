# BB Office

A full-screen, interactive 3D office for five AI workspaces: GPT, Claude, Gemini, Muse and Copilot. GPT and Claude are the main workspaces, with larger front-center desks and highlighted roster entries; Gemini, Muse and Copilot provide supporting workspaces. Frosted rear glazing keeps the cutaway free of floating exterior scenery. The office includes individual desks, seated animated staff, a glass meeting room, pantry and lounge. Drag to orbit, scroll to zoom, or reset the view. Animation can be paused and starts paused with reduced-motion preferences.

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

Staff use original stylized mini-character geometry: oversized expressive faces, pastel hoodies, sneakers and distinct hair/headphone/cap accessories. The office pairs lighter wood and walls with a lavender rug/sofa, shared beanbag seating, pastel pinboard and rounded desk/meeting-table footprints. Existing service shortcuts and local workspaces are unchanged.
