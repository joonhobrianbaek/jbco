# BB Office

A full-screen, interactive 3D office for five AI workspaces: GPT, Claude, Gemini, Muse and Copilot. The office includes individual desks, seated animated staff, a glass meeting room, pantry and lounge. Drag to orbit, scroll to zoom, or reset the view. Animation can be paused and starts paused with reduced-motion preferences.

Requires Node.js 20 or later. No application dependency installation.

```sh
npm run check
npm test
npm start
```

The default port is 3000; override with `PORT=3001 npm start`. The `public/` directory deploys directly to GitHub Pages with relative asset URLs. WebGL 2 is required for the office; the task board remains available without it.

Click a desk or employee in the bottom roster to assign a task. The 업무 button opens the task board. Assignments persist in this browser's localStorage using the existing `jbco-plays` key, preserving earlier tasks. They are not shared or backed up. Progress and completion are manual. **AI accounts and APIs are not connected; assignments are not sent to any provider.** Desk screens reflect saved assignment counts.

The BB brand image is the original BB_favicon_64x64.png from joonhobrianbaek/bb-favicon, copied unchanged to public/brand.png. Office geometry, materials and textures are generated locally. Three.js 0.186.1 is vendored under public/vendor with its MIT license; no external runtime fonts, scripts or images are required.

Earlier basketball motion experiments remain at `lab.html` for reference, separate from the office. Their assets, source attribution, reproduction scripts and eight regression tests are retained. See public/assets/licenses/credits.txt and the lab's asset-source link for licensing details.
