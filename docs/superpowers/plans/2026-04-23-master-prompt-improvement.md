# Master Prompt Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sparse default master prompt with focused, quality-enforcing instructions and remove the hardcoded 25-35 card count cap so the AI can choose how many signature cards the strategy requires.

**Architecture:** Two changes in the backend (`CommanderHut-backend`, branch `masterprompt-admin`): (1) update `OUTPUT_FORMAT` and `DEFAULTS` in `promptCache.js` and fix the two affected tests, (2) run a seed script to upsert the new content into the live MongoDB `MasterPrompt` document.

**Tech Stack:** Node.js ESM, MongoDB/Mongoose, Vitest

---

## File Structure

- Modify: `services/aiDeckBuilder/promptCache.js` — update `OUTPUT_FORMAT` constant and `DEFAULTS` object
- Modify: `tests/services/aiDeckBuilder/promptCache.test.js` — update two tests that assert the old default text
- Create: `scripts/seedMasterPrompt.js` — one-shot script to upsert new content into MongoDB

---

### Task 1: Update OUTPUT_FORMAT, DEFAULTS, and tests in promptCache.js

**Files:**
- Modify: `services/aiDeckBuilder/promptCache.js`
- Modify: `tests/services/aiDeckBuilder/promptCache.test.js`

- [ ] **Step 1: Update `OUTPUT_FORMAT` in `promptCache.js`**

Change line `'  signature_cards: array of 25-35 objects, each with:',` to remove the count cap. The full updated constant:

```javascript
export const OUTPUT_FORMAT = [
  'Output ONLY valid JSON — no markdown, no bold (**), no explanation, no code fences.',
  'Required JSON keys:',
  '  commander: string (exact real Magic: The Gathering card name)',
  '  color_identity: array of letters from W U B R G only',
  '  strategy: string, max 400 chars',
  '  signature_cards: array of objects, each with:',
  '    name: string (exact real Magic: The Gathering card name)',
  '    role: one of win_con | ramp | draw | removal | interaction | synergy | utility',
  'Do not invent card names.',
].join('\n');
```

- [ ] **Step 2: Update `DEFAULTS` in `promptCache.js`**

Replace the `DEFAULTS` object with the new prompt content:

```javascript
const DEFAULTS = {
  role_description:
    'You are a Magic: The Gathering Commander deck-building assistant. Your only purpose is to build Commander decks. You have deep knowledge of MTG card interactions, synergies, mana curves, and competitive brackets.',
  domain_restrictions:
    'Only respond to Magic: The Gathering Commander deck-building requests. If the user asks about anything else — weather, sports, general knowledge, other games, or any non-MTG topic — respond with exactly: "I can only help with Magic: The Gathering Commander deck-building." Do not elaborate, apologize, or engage with the off-topic request.',
  additional_rules:
    'Card selection rules:\n- Use only exact, real Magic: The Gathering card names as they appear in official sets. Never invent, abbreviate, or paraphrase card names.\n- Every card must have a clear reason to be in the deck — synergy with the commander, the strategy, or another key piece.\n- Choose as many signature cards as the strategy requires. Prioritize quality and coherence over quantity.\n- Include a mix of roles appropriate to the strategy: ramp, card draw, removal, and win conditions. Do not over-index on any single role.\n- Respect the power bracket: do not include cards that exceed or fall far below the requested bracket level.',
};
```

- [ ] **Step 3: Update the two failing tests in `tests/services/aiDeckBuilder/promptCache.test.js`**

The tests `'falls back to defaults when DB returns null'` and `'falls back to defaults when DB throws'` currently assert `toContain('Commander deck-building expert')` which no longer exists in DEFAULTS. Update both to check the new default text:

```javascript
it('falls back to defaults when DB returns null', async () => {
  MasterPrompt.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
  const result = await buildSystemPrompt({ budget_usd: null, power_bracket: 1 });
  expect(result).toContain('Magic: The Gathering Commander deck-building assistant');
});

it('falls back to defaults when DB throws', async () => {
  MasterPrompt.findOne.mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('DB down')) });
  const result = await buildSystemPrompt({ budget_usd: null, power_bracket: 1 });
  expect(result).toContain('Magic: The Gathering Commander deck-building assistant');
});
```

- [ ] **Step 4: Run the test suite — all tests must pass**

```bash
npm test
```

Expected output:
```
✓ tests/services/aiDeckBuilder/promptCache.test.js (10 tests)
✓ tests/models/masterPrompt.test.js (1 test)
✓ tests/controllers/masterpromptController.test.js (8 tests)
... all other suites pass
Test Files: N passed
Tests: 78 passed
```

If any test fails, fix it before continuing.

- [ ] **Step 5: Commit**

```bash
git add services/aiDeckBuilder/promptCache.js tests/services/aiDeckBuilder/promptCache.test.js
git commit -m "feat: improve master prompt defaults and remove 25-35 card count cap"
```

---

### Task 2: Seed new prompt content into MongoDB

**Files:**
- Create: `scripts/seedMasterPrompt.js`

- [ ] **Step 1: Create `scripts/seedMasterPrompt.js`**

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MasterPrompt from '../models/MasterPrompt.js';

dotenv.config();

const NEW_PROMPT = {
  role_description:
    'You are a Magic: The Gathering Commander deck-building assistant. Your only purpose is to build Commander decks. You have deep knowledge of MTG card interactions, synergies, mana curves, and competitive brackets.',
  domain_restrictions:
    'Only respond to Magic: The Gathering Commander deck-building requests. If the user asks about anything else — weather, sports, general knowledge, other games, or any non-MTG topic — respond with exactly: "I can only help with Magic: The Gathering Commander deck-building." Do not elaborate, apologize, or engage with the off-topic request.',
  additional_rules:
    'Card selection rules:\n- Use only exact, real Magic: The Gathering card names as they appear in official sets. Never invent, abbreviate, or paraphrase card names.\n- Every card must have a clear reason to be in the deck — synergy with the commander, the strategy, or another key piece.\n- Choose as many signature cards as the strategy requires. Prioritize quality and coherence over quantity.\n- Include a mix of roles appropriate to the strategy: ramp, card draw, removal, and win conditions. Do not over-index on any single role.\n- Respect the power bracket: do not include cards that exceed or fall far below the requested bracket level.',
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const result = await MasterPrompt.findOneAndUpdate(
    {},
    {
      $set: {
        ...NEW_PROMPT,
        updated_by: 'seed-script',
        updated_at: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  console.log('Master prompt seeded successfully. Document ID:', result._id);
  console.log('role_description:', result.role_description.slice(0, 60) + '...');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the seed script**

```bash
node scripts/seedMasterPrompt.js
```

Expected output:
```
Connected to MongoDB
Master prompt seeded successfully. Document ID: <some-object-id>
role_description: You are a Magic: The Gathering Commander deck-building...
```

If it fails with `MONGODB_URI is not set`, check that your `.env` file exists and has the correct key name (may be `MONGO_URI` — update the script to match your `.env`).

- [ ] **Step 3: Verify the seed by calling the admin endpoint**

With the server running locally:

```bash
curl -s http://localhost:3000/api/admin/masterprompt \
  -H "Cookie: <your-auth-cookie>" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); console.log(j.role_description)"
```

Expected: `You are a Magic: The Gathering Commander deck-building assistant...`

(Alternatively, use Postman or the browser DevTools to call `GET /api/admin/masterprompt` while logged in as an admin.)

- [ ] **Step 4: Commit**

```bash
git add scripts/seedMasterPrompt.js
git commit -m "feat: add seed script for improved master prompt content"
```
