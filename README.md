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

## 3D motion study

Open `lab.html` (linked as **3D 연구실** in the existing court). This separate prototype preserves the published five-player scene. It uses an original articulated human model, world-space foot targets with analytic two-bone leg/arm IK, a held-ball release, a gravity-driven shot, a three-dimensional hoop/net, and a continuous ten-second step-back sequence. Orbit the camera, select one of four views, scrub the timeline, slow playback to 0.5×/0.25×, and toggle contact analysis. Reduced-motion users start paused. Requires browser WebGL 2; an explicit fallback appears if unavailable.

This is a motion prototype with a procedural human model and authored animation, not NBA 2K fidelity or motion capture. Production character meshes, skin weighting, clothing deformation and captured basketball motions remain future work. A low automatic return pass resets the practice ball between possessions.

`npm test` checks world-space foot planting, bone reachability, shot physics, contact/loop continuity, jumping and landing. `npm run check` checks application module syntax. Browser verification also covers WebGL rendering, 100 sampled rig poses, cameras, slow motion, timeline controls, mobile layout and the preserved original scene.

The Three.js 0.186.1 ES modules and OrbitControls are vendored under `public/vendor/`; see `THREE-LICENSE.txt` for the MIT license. All assets are local and the app needs no build or package installation.
