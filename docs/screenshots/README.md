# 📷 README screenshots

These PNGs are embedded in the root [`README.md`](../../README.md).

## 🔄 Regenerate (recommended)

```bash
pnpm screenshots
```

Requires Chromium (one-time: `pnpm exec playwright install chromium`). The spec is [`e2e/readme-screenshots.spec.ts`](../../e2e/readme-screenshots.spec.ts).

| File | Captured in the flow |
|------|----------------------|
| `betting.png` | Betting phase with extra $10 chips on the bet |
| `playing.png` | After deal (Hit visible) or instant result if blackjack |
| `strategy-modal.png` | Strategy / hand-complete dialog |
| `settings.png` | Table Rules modal |

## ✋ Manual capture

Run `pnpm dev`, open the app at the URL shown (often port **5173**), use a ~**1280px** wide window, and save PNGs with the filenames above.
