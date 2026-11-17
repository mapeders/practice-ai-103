# AI-103 practice page — design

**Date:** 2026-11-05
**Goal:** A single-file practice app for Microsoft exam AI-103 *Developing AI Apps and Agents on Azure*, modelled on
`../practice-ai-102/index.html`, with questions organised by the official study guide's "Skills at a glance".

## Study guide (skills measured as of April 16, 2026)
Source: https://learn.microsoft.com/en-gb/credentials/certifications/resources/study-guides/ai-103

| Topic id | Skill area | Weight | Status |
|---|---|---|---|
| plan-and-manage | Plan and manage an Azure AI solution | 25–30% | 40 questions (ids 121–150, 186–195), responsible AI sub-area only |
| genai-agentic | Implement generative AI and agentic solutions | 30–35% | placeholder card (no questions yet) |
| computer-vision | Implement computer vision solutions | 10–15% | 55 questions (ids 1–40, 151–165) |
| text-analysis | Implement text analysis solutions | 10–15% | 60 questions (ids 41–80, 166–185) |
| information-extraction | Implement information extraction solutions | 10–15% | 40 questions (ids 81–120) |

The first iteration covers the three areas the user asked to start with. The home screen lists all five in official
order so the remaining two can be filled in later without touching the app code.

## Sources
Learning paths referenced by course AI-103T00 and the study guide's "Study resources":
- Develop computer vision solutions with Microsoft Foundry — `/training/paths/develop-computer-vision-with-foundry/`
- Develop natural language solutions in Azure — `/training/paths/develop-language-solutions-azure-ai/`
- Extract insights from visual data on Azure — `/training/paths/insight-visual-data/` (Content Understanding,
  Document Intelligence, Azure AI Search knowledge mining)
- Product docs for bullets not covered by Learn modules (image edits, Sora 2, Content Safety / Prompt Shields,
  sentiment, structured outputs, custom speech, vector/hybrid/semantic search, OCR and Content Understanding skills).

The exact allowed URL set per topic lives in `build/url-list.json`; every question's `source.url` must be in it.

## Pipeline
```
build/url-list.json        allowed sources per topic
build/AUTHORING-BRIEF.md   rules for question authors (grounding, schema, type mix, naming)
build/chunk-<topic>.json   40 questions per topic (24 mc_single, 6 mc_multi, 5 sequence, 5 hotspot)
build/chunk-<topic>-<skill>.json   focused top-up chunks for one study-guide sub-area (see below)
build/validate.js          schema + id range + source whitelist check per chunk
build/assemble.js          merges chunks -> build/questions.json and injects into build/template.html -> index.html
build/smoke.js             headless Chrome: renders and auto-answers every question through the real DOM code
```
Rebuild: `node build/assemble.js && node build/smoke.js`.

## App
Same architecture as the AI-102 page: Tailwind CDN, three views (home / practice / results), four question types,
per-question Learn attribution, localStorage progress (`ai103-practice-v1`), wrong-answer queue, weighted mixed mode.
Additions over AI-102: "Unanswered only" mode, topic badge on each question, pass-line hint on results, placeholder
cards for topics without questions.

## Score-report top-up (2026-11-17)
The 13 November 2026 score report (687 / 700) named three weakest skills. Each got a focused top-up chunk, grounded in
Learn pages fetched on the day; the new source URLs are in the `docs` arrays of `build/url-list.json`.

| Score-report skill | Topic | Before | Added | Chunk |
|---|---|---|---|---|
| Implement responsible AI across generative AI and agentic systems | plan-and-manage | 0 | 40 (ids 121–150, 186–195) | `chunk-plan-and-manage-responsible-ai.json`, `-2.json` |
| Implement responsible AI for multimodal content | computer-vision | 9 (ids 20, 32–39) | 15 (ids 151–165) | `chunk-computer-vision-responsible-ai.json` |
| Implement speech solutions | text-analysis | 14 (ids 42, 64, 65, 70–80) | 20 (ids 166–185) | `chunk-text-analysis-speech.json` |

`build/validate.js` takes an optional fifth argument, a JSON array of extra allowed URLs, so a chunk can be authored
before its sources are merged into `url-list.json`.

### Weak areas only mode
Questions that drill one of the three score-report skills carry an optional `skill` field
(`responsible-ai-genai`, `responsible-ai-multimodal`, `speech`); `WEAK_SKILLS` in `build/template.html` holds the
titles and `build/validate.js` rejects unknown values. The home screen shows a "Weak areas only" card with one button
for all 98 tagged questions and one per skill. A weak-area session is shuffled and then ordered unanswered first,
previously wrong second, previously correct last. Tagged questions show a "weak area" badge in every mode.
