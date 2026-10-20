# JBCO · After Hours

A full-screen basketball practice arena with original photorealistic athlete assets, a projected hardwood court, dimensional backboards/supports/nets, dribbling a repeating approach/jump/dunk/landing sequence, a Booker-inspired orange-uniform shooting guard, a bearded guard repeating step-back threes from beyond the arc, and a Lillard-inspired red-uniform point guard shooting deep threes at the opposite basket. Shot arcs and net responses are staggered across players. The athletes are animated image sprites, not fully rigged 3D human models. Their design draws on contrasting basketball body types rather than claiming an official athlete affiliation.

Requires Node.js 20 or later. No application dependency installation.

```sh
cd /workspace/jbco
npm run check
npm start
```

Default port 3000; override with `PORT=3001 npm start`. The `public/` directory also deploys directly to GitHub Pages. Assets use relative URLs for repository-path hosting.

Click an athlete or the bottom roster to assign a task. The top-right 업무 button opens the collapsed task board. Tasks persist in localStorage on the current browser origin; they are not shared or backed up. All five provider roles remain available in the assignment form. AI services are not connected and tasks are not transmitted. Progress and completion are manual. Motion can be paused, reduced-motion preferences are respected, and fullscreen is available where supported.

Brand: the original BB_favicon_64x64.png from joonhobrianbaek/bb-favicon, copied unchanged to public/brand.png for the header, favicon and center-court mark.

Artwork: original generated athlete sprite images; court, arena, lighting, hoops and basketballs rendered in Canvas. No external image or font requests.

## 3D motion lab

Open `lab.html` from **3D 연구실** in the existing court. The default now uses a real skin-weighted mesh with 80 bones, diffuse/normal maps and two retargeted CMU basketball recordings. Select **드리블 / 슛** or **점프슛**. Orbit the camera, select one of four views, scrub, use 0.5×/0.25× playback, or toggle analysis. **이전 관절 모델 · 비교** retains the original procedural step-back study. WebGL 2 is required; loading errors fall back to the earlier rig, and unavailable WebGL displays an explicit return link. Reduced-motion users start paused.

The avatar is the generic Microsoft Rocketbox Sports_Male_04 model (MIT), not a likeness of an NBA player or a 2K asset. The captured body motion is CMU 06_15 and 124_03 (originally 120fps), retargeted/baked at 60fps. CMU did not capture fingers. Wrist stabilization, ball trajectories, rim/net response and an explicit 0.8s loop transition are corrections authored for this viewer. Foot-contact labels are estimates, not force-plate measurements. This is an actual skinned/mocap upgrade, but it does not claim NBA 2K visual or animation fidelity.

Runtime asset: `public/assets/player-mocap.glb`, about 5.6 MiB, all textures embedded at 1024px. Full attribution/usage terms are linked in the viewer under **에셋 출처**. No external runtime assets or package installation.

`npm test` runs eight tests: the original rig's planting/reachability/physics/continuity, and the new GLB's skin weights, real varying animation tracks, sampling rate, texture budget and source metadata. Browser validation covers both captured clips, deformation, loop/release continuity, cameras, slow motion, comparison mode, mobile layout and the preserved original five-player court.

To reproduce the asset with Blender 4.3.2 and Python 3:

```sh
python3 scripts/fetch_mocap_sources.py /tmp/bb-mocap-sources
blender -b -t 2 --python scripts/build_mocap.py -- --sources /tmp/bb-mocap-sources --output /tmp/player-mocap.glb
```

The downloader uses pinned upstream commits and verifies SHA-256 checksums. The builder creates the skinned model and both clips from source and also writes a diagnostic trajectory JSON beside the output. The rebuild was verified byte-for-byte against the runtime GLB. Building assets is optional for running the app.

Three.js 0.186.1 modules are vendored under `public/vendor/`; see `THREE-LICENSE.txt` for MIT terms.
