# ManagerGPT — Online Vibe Coder

A tiny, deployable **chat + code editor** web app.

- **Online mode**: uses a Netlify Function (`/.netlify/functions/managergpt`) to call an LLM without exposing API keys in the browser.
- **Offline mode**: if no API key is configured, the UI still works and gives a helpful fallback response.

## Run / deploy

### Netlify (recommended)

1. Deploy this repo to Netlify.
2. Set environment variables:
   - `OPENAI_API_KEY` (required)
   - `OPENAI_MODEL` (optional, default `gpt-4.1-mini`)
   - `OPENAI_BASE_URL` (optional, default `https://api.openai.com`)
3. Visit your site and start chatting.

## How to use

- **Chat**: tell ManagerGPT what you want built.
- **Scratchpad**: paste code or let ManagerGPT generate code.
- **Apply code**: if the assistant includes a fenced code block, click “Apply code” to replace the editor contents.

## Notes

This repo started as an NFT landing-page template, but the UI is now ManagerGPT.
