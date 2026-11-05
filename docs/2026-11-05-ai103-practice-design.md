# AI-103 practice page — design

**Date:** 2026-11-05
**Goal:** A single-file practice app for Microsoft exam AI-103 *Developing AI Apps and Agents on Azure*, modelled on
`../practice-ai-102/index.html`, with questions organised by the official study guide's "Skills at a glance".

## Study guide (skills measured as of April 16, 2026)
Source: https://learn.microsoft.com/en-gb/credentials/certifications/resources/study-guides/ai-103

| Topic id | Skill area | Weight | Status |
|---|---|---|---|
| plan-and-manage | Plan and manage an Azure AI solution | 25–30% | placeholder card (no questions yet) |
| genai-agentic | Implement generative AI and agentic solutions | 30–35% | placeholder card (no questions yet) |
| computer-vision | Implement computer vision solutions | 10–15% | 40 questions (ids 1–40) |
| text-analysis | Implement text analysis solutions | 10–15% | 40 questions (ids 41–80) |
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
