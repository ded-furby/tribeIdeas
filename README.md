# tribeIdeas

Validate startup ideas, LinkedIn posts, pitches, and launch concepts with a live audience simulation and TRIBE v2-derived brain response references.

## What It Does

tribeIdeas takes an idea and produces:

- a validation verdict and confidence rating
- simulated audience split inspired by MiroFish-style swarm thinking
- hoverable phrase insights
- an fsaverage cortical-surface brain render with interactive response hotspots
- top questions, objections, and a stronger rewrite

The MVP is intentionally Vercel-friendly. It does **not** run the full TRIBE v2 checkpoint in a serverless function. The brain panel uses lightweight reference archetypes that can later be replaced by a real GPU inference worker.

The first screen opens with a sample report already rendered, so users immediately see the animated swarm world, verdict, confidence score, phrase popovers, and brain response map before running their own idea.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without `DEEPSEEK_API_KEY`, the app uses the local validation engine. With a key, `/api/validate` asks DeepSeek to enhance the report while preserving the same report schema.

## Environment

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
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

TRIBE v2 is licensed CC-BY-NC-4.0. This MVP presents brain response as a reference visualization, not mind reading, medical advice, therapy, or individualized fMRI prediction.
