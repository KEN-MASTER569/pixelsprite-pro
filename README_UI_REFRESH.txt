PixelSprite Pro UI Refresh — v3.0

Files included:
- index.html
- styles.css
- app.js

What changed:
- Reworked the animation timeline as a docked professional-style panel with a responsive height.
- Improved frame thumbnails, selected-frame styling, frame label readability, and horizontal filmstrip scrolling.
- Replaced forced always-visible sidebar scrollbars with styled, independently scrollable side panels.
- Added automatic horizontal reveal of the selected frame when selecting frames manually; playback does not force-scroll the strip.
- Removed conflicting inline layout styles from timeline elements and bumped CSS/JS cache versions to 3.0.

Install:
1. Make a backup of the current three files.
2. Extract this ZIP.
3. Replace the existing index.html, styles.css, and app.js together in the same project folder.
4. Reload with Ctrl+F5 to bypass cached assets.

Validation performed: JavaScript syntax check (`node --check app.js`) and HTML ID/link/script parsing.
Note: this environment did not run a full interactive browser regression test, so test drawing, layers, animation playback, and all export/import paths in your local project before publishing.
