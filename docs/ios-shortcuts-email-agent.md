# iOS Shortcuts: AI Email Agent (via Netlify Function)

This repo can expose a webhook that iOS Shortcuts calls to generate an email draft:

- **Endpoint**: `https://<your-site>/.netlify/functions/agent-email`
- **Method**: `POST`
- **Request**: JSON
- **Response**: JSON containing `subject` and `body`

## 1) Deploy

Deploy this repo to Netlify (or any Netlify-compatible host).

Set environment variables:

- `LLM_PROVIDER`: `openai` (default) or `anthropic`
- `LLM_API_KEY`: your provider API key (server-side only)
- `LLM_MODEL`: optional (defaults to a reasonable model per provider)
- `SPONSOR_URL`: optional (default sponsor/ad link)

## 2) JSON contract

### Request body (example)

```json
{
  "to": "person@example.com",
  "tone": "friendly and concise",
  "instructions": "Keep it under 150 words. Include 3 bullet points.",
  "context": "We met at the conference yesterday. They asked for pricing info.",
  "prompt": "Write a follow-up email asking for a 20-min call next week.",
  "signature": "—\\nAlex",
  "includeSponsor": true,
  "sponsorUrl": "https://your-site/sponsor?src=shortcut"
}
```

### Response body (example)

```json
{
  "subject": "Quick follow-up + 20-min chat next week?",
  "body": "Hi ...\\n\\n—\\nSponsored: https://your-site/sponsor?src=shortcut",
  "sponsor": { "url": "https://your-site/sponsor?src=shortcut" }
}
```

Notes:
- The function **does not send email**. It only generates the draft.
- The Shortcut decides whether to open a compose sheet or send.

## 3) Build the Shortcut (step-by-step)

Create a new Shortcut named **“AI Email Draft”**:

1. **Ask for Input** (Text)
   - Prompt: “What’s the email about?”
   - Save as variable: `Prompt`
2. **Ask for Input** (Text)
   - Prompt: “Recipient email (optional)”
   - Save as variable: `To`
3. **Ask for Input** (Text)
   - Prompt: “Any context (optional)”
   - Save as variable: `Context`
4. **Dictionary**
   - `to`: `To`
   - `tone`: `friendly and concise`
   - `instructions`: `Keep it under 150 words.`
   - `context`: `Context`
   - `prompt`: `Prompt`
   - `signature`: your signature
   - `includeSponsor`: `true`
   - `sponsorUrl`: `https://<your-site>/sponsor?src=shortcut`
5. **Get Contents of URL**
   - URL: `https://<your-site>/.netlify/functions/agent-email`
   - Method: `POST`
   - Request Body: **JSON**
   - JSON: (use the Dictionary from step 4)
6. **Get Dictionary from Input**
7. **Get Value for Key** `subject`
   - Save as variable: `Subject`
8. **Get Value for Key** `body`
   - Save as variable: `Body`
9. Use one of:
   - **Email** (compose): To = `To`, Subject = `Subject`, Body = `Body` (recommended)
   - **Send Email** (auto-send): only if you truly want automation

## 4) Ads / monetization that works with Shortcuts

Shortcuts can’t reliably embed ad networks inside the app UI, so the open-source-friendly pattern is:

- Add a **“Sponsored” link** to the generated email (done by the function when `includeSponsor` is `true`)
- Optionally add a **“Show Web Page”** action at the end of the Shortcut that opens:
  - `https://<your-site>/sponsor?src=shortcut`

That `sponsor` page can contain:
- Affiliate links
- Sponsor copy
- Your ad network snippet (AdSense/Carbon/etc.)

