# JBCO · After Hours

A full-screen basketball practice arena with original photorealistic athlete assets, a projected hardwood court, dimensional backboards/supports/nets, dribbling and a repeating approach/jump/dunk/landing sequence. The athletes are animated image sprites, not fully rigged 3D human models. Their design draws on contrasting basketball body types rather than claiming an official athlete affiliation.

Requires Node.js 20 or later. No application dependency installation.

```sh
cd /workspace/jbco
npm run check
npm start
```

Default port 3000; override with `PORT=3001 npm start`. The `public/` directory also deploys directly to GitHub Pages. Assets use relative URLs for repository-path hosting.

Click an athlete or the bottom roster to assign a task. The top-right 업무 button opens the collapsed task board. Tasks persist in localStorage on the current browser origin; they are not shared or backed up. All five provider roles remain available in the assignment form. AI services are not connected and tasks are not transmitted. Progress and completion are manual. Motion can be paused, reduced-motion preferences are respected, and fullscreen is available where supported.

Artwork: original generated athlete sprite images; court, arena, lighting, hoops and basketballs rendered in Canvas. No external image or font requests.
