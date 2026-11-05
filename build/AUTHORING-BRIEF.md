# AI-103 practice question authoring brief

Target: single-file practice app for Microsoft exam AI-103 "Developing AI Apps and Agents on Azure"
(study guide: https://learn.microsoft.com/en-gb/credentials/certifications/resources/study-guides/ai-103).

## Output
Write a JSON array to `build/chunk-<topic>.json`. Exactly 40 questions. Validate with
`node build/validate.js build/chunk-<topic>.json <topic> <id-min> <id-max>` and fix until it exits 0.

Type mix (hard requirement): 24 mc_single, 6 mc_multi, 5 sequence, 5 hotspot.

## Schema
```
{ "id": <int>, "topic": "<topic>", "type": "mc_single"|"mc_multi"|"sequence"|"hotspot",
  "question": "...", "explanation": "...",
  "source": { "path": "<learning path title>", "module": "<module title>", "unit": "<unit title>", "url": "<exact allowed URL>" },
  mc_single/mc_multi: "options": [{"id":"A","text":"..."}, ...4 options], "correct": ["B"]           (mc_multi: 2-3 correct)
  sequence:           "items": [{"id":"S1","text":"..."}, ... 4-6 items], "correct_order": ["S1",...]
  hotspot:            "blanks": [{"id":"B1","prompt":"...","options":[{"id":"a","text":"..."},...],"correct":"b"}, ... 2-4 blanks]
}
```
`source.url` MUST be one of the allowed URLs for your topic in `build/url-list.json`: either `<module.base><unit-slug>`
(optionally with `?pivots=text`) or one of the `docs` URLs. For docs URLs set `path` to the doc set name
(e.g. "Azure OpenAI in Foundry Models documentation"), `module` to the doc section, `unit` to the page title.

## Grounding rules (non-negotiable)
1. Fetch EVERY unit URL and doc URL for your topic with WebFetch BEFORE writing questions. Ask WebFetch for the full
   content: concepts, code samples, parameter names, model names, limits, step sequences, REST paths, SDK class/method names.
   If a doc URL 404s, use WebSearch (allowed_domains learn.microsoft.com) to find the current page, fetch it, and ADD it to the
   `docs` array for your topic in `build/url-list.json` (edit the JSON, keep it valid) so the validator accepts it.
2. Every question must be answerable from a specific fetched page, and the explanation must restate the fact from that page.
   No invented product behaviour, parameter names, or limits. If unsure, pick a different fact.
3. Scenario style, like real Microsoft exams: "You are building...", "A company needs...", "Which ... should you use?".
   Mix conceptual (choose service/model/mode), implementation (SDK/REST/parameter), and ordering (sequence) questions.
4. Distractors must be plausible and specific (real Azure services/parameters used wrongly), not silly.
5. Cover the study-guide bullets for your skill area as evenly as the sources allow (list in your prompt). At least one
   question per bullet where a source supports it. Include Python SDK and REST details where the sources show them.
6. Naming: use current names — "Microsoft Foundry" (not "Azure AI Foundry"/"AI Studio"), "Foundry Tools",
   "Azure OpenAI in Foundry Models", "Azure Content Understanding", "Azure Document Intelligence", "Azure AI Search".
7. No duplicates or near-duplicates. Each question tests a distinct fact.
8. Explanations: 2-5 sentences; explain why the right answer is right AND why the main distractor is wrong.
9. Plain text only in question/explanation (rendered in <pre>); code snippets allowed inline with newlines, no markdown.
10. Shuffle correct-answer letters across questions (don't make "A" correct most of the time).

Report back: question count, type counts, validator output, list of any URLs that 404'd and what you substituted.
