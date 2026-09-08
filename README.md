# My Personal AI — mobile setup

This is a zero-cost prototype using:
- OpenRouter's free-model router for text AI.
- Browser speech recognition for voice input (browser-dependent).
- Browser speech synthesis for voice output.
- localStorage for memory and chat history.
- Built-in calculator, time, remember, forget and memory commands.

## 1. Create a free OpenRouter key
Open OpenRouter, create an account and an API key. Free models are available, but availability/rate limits can change.

## 2. Run the files
The app should be served over HTTPS for the best browser microphone/PWA behavior. Easiest phone-only options:
- Upload this folder to a static host such as GitHub Pages or Cloudflare Pages.
- Or use any static-file hosting app/site you already trust.

Do NOT put a personal API key into a public repository.

## 3. First launch
1. Open the deployed site in Chrome.
2. Tap ⚙️.
3. Paste your OpenRouter API key.
4. Choose assistant name and personality.
5. Save.
6. Ask a question.
7. Tap the microphone button for voice input.
8. Use browser's "Add to Home screen" to make it behave like an app.

## Commands
/calc 25*1600
/time
/remember My preferred language is Roman Urdu.
/memory
/forget Roman Urdu

## Important security note
This is a client-side personal prototype. The API key is stored in browser localStorage and can be extracted from the device/browser. For a public app, move the API call to a server/worker and never expose the key to the browser.

## Free-limit note
OpenRouter's free models have rate limits and model availability can change. The AI itself is not guaranteed unlimited.
