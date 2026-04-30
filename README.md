# AdCortex

Predict how a reel, video ad, or campaign hook will feel to viewers before you publish it.

## What It Does

AdCortex takes a reel/video link or local video upload plus one line describing the product and audience. It produces:

- a TRIBE-demo-style brain response view with white cortex, dark head silhouette, and red predicted activation
- attention, trust, recall, friction, confidence, and projected lift
- a compact detected-product summary from your one-line input and any public link context it can read
- a MiroFish-inspired predictive simulation trace
- specific ad edits and next A/B tests

The MVP is intentionally Vercel-friendly. It does **not** run the full TRIBE v2 checkpoint in a serverless function. The brain panel uses a generated fsaverage cortical render plus lightweight predictive response signals that can later be replaced by a GPU inference worker. The brain stage is draggable; double-click it to reset the view.

Uploads are previewed locally in the browser. The API receives only creative metadata and the typed one-line context. For public links, the API makes a best-effort pass over title/meta/visible text and ignores it if blocked.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without `DEEPSEEK_API_KEY`, the app uses the local ad predictor. With a key, `/api/analyze-ad` asks DeepSeek to sharpen the report while preserving the same schema. The default is the fast non-reasoning `deepseek-chat` model with a short timeout, then the app falls back to the local predictor instead of making the user wait.

## Environment

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT_MS=9000
```

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment

Deploy the repo to Vercel and add the DeepSeek environment variables in the Vercel dashboard. The app builds as a standard Next.js App Router project.

## TRIBE v2 Note

TRIBE v2 is licensed CC-BY-NC-4.0. This MVP presents brain response as a predictive reference visualization, not mind reading, medical advice, therapy, or individualized fMRI prediction.
