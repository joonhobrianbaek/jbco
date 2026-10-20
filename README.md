# JBCO AI Arena

A pixel basketball arena for a five-person AI team. Requires Node.js 20 or later; no application dependencies or installation step.

```sh
cd /workspace/jbco
npm run check
npm start
```

The server listens on port 3000 (override with `PORT`). Open it through your development environment's port forwarding. The interface supports task assignment, filtering, manual progress/completion, deletion, and browser-local persistence. Tasks are stored in localStorage on the current browser origin; they are not shared or backed up. AI services are not connected and no tasks are transmitted to providers. Muse is represented as a video search/management role.

Character and court artwork is original inline SVG/CSS. Google Fonts are optional; system fonts work offline. Respect reduced motion preferences, or toggle motion in the footer.
