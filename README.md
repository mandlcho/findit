<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1K6dmG7TUom2YZlNrwgydH03Dr4AtlNBR

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Trigger the GitHub Pages deployment

Use the helper script to dispatch the `Deploy to GitHub Pages` workflow from your terminal:

```bash
./scripts/run-pages-workflow.sh [branch]
```

The branch defaults to `main`. The script requires the [GitHub CLI](https://cli.github.com/) to be installed and authenticated (`gh auth login`). It waits for the workflow to finish and prints the resulting Pages URL so you can open the live site once the deployment completes.
