# AdCortex

Predict how a reel, video ad, or campaign hook will feel to viewers before you publish it.

## What It Does

AdCortex takes a reel/video link or local video upload plus one line describing the product and audience. It produces:

- a TRIBE-demo-style brain response view with white cortex, dark head silhouette, and red predicted activation
- attention, trust, recall, friction, confidence, and projected lift
- a compact detected-product summary from your one-line input and any public link context it can read
- a MiroFish-inspired predictive simulation trace
- specific ad edits and next A/B tests

The MVP is intentionally Vercel-friendly. It does **not** run the full TRIBE v2 checkpoint in a serverless function. The brain panel uses an interactive procedural cortex render plus lightweight predictive response signals that can later be replaced by a GPU inference worker. The brain stage is draggable; double-click it to reset the view.

Uploads are previewed locally in the browser. The API receives only creative metadata and the typed one-line context. For public links, the API makes a best-effort pass over title/meta/visible text and ignores it if blocked.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without an API key, the app uses the fast ad predictor. With a compatible chat-completions key, `/api/analyze-ad` sharpens the report while preserving the same schema. The request has a short timeout so users are not left waiting.

## Environment

```env
AI_API_KEY=
AI_BASE_URL=https://api.example.com
AI_MODEL=chat-model
AI_TIMEOUT_MS=9000
```

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment

Deploy the repo to Vercel and add the model provider environment variables in the Vercel dashboard. The app builds as a standard Next.js App Router project.

## TRIBE v2 Note

TRIBE v2 is licensed CC-BY-NC-4.0. This MVP presents brain response as a predictive reference visualization, not mind reading, medical advice, therapy, or individualized fMRI prediction.
