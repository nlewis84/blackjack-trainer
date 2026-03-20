import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

const outDir = path.join(process.cwd(), "docs", "screenshots");

/** Let card / chip / dialog CSS animations finish before capturing. */
const SCREENSHOT_SETTLE_MS = 2000;

async function waitForAnimations(page: Page) {
  await page.waitForTimeout(SCREENSHOT_SETTLE_MS);
}

test.describe.configure({ mode: "serial" });

test("capture README screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  await expect(page.getByText("Place Your Bet")).toBeVisible();

  await page.getByRole("button", { name: "$10", exact: true }).click();
  await page.getByRole("button", { name: "$10", exact: true }).click();
  await waitForAnimations(page);

  await page.screenshot({
    path: path.join(outDir, "betting.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /deal/i }).click();

  const hit = page.getByRole("button", { name: "Hit" });
  const newHand = page.getByRole("button", { name: /new hand/i });
  await expect(hit.or(newHand)).toBeVisible({ timeout: 25_000 });
  await waitForAnimations(page);

  if (await hit.isVisible()) {
    await page.screenshot({
      path: path.join(outDir, "playing.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Stand" }).click();
  } else {
    await page.screenshot({
      path: path.join(outDir, "playing.png"),
      fullPage: true,
    });
  }

  await newHand.waitFor({ state: "visible", timeout: 30_000 });

  const dialog = page.getByRole("dialog");
  const review = page.getByRole("button", { name: /review strategy/i });
  try {
    await dialog.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    await review.click();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
  }

  await expect(
    dialog.getByText(/strategy review|hand complete/i)
  ).toBeVisible();
  await waitForAnimations(page);

  await page.screenshot({
    path: path.join(outDir, "strategy-modal.png"),
    fullPage: true,
  });

  await dialog.getByRole("button", { name: /next hand/i }).click();
  await expect(page.getByText("Place Your Bet")).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Table Rules")).toBeVisible();
  await waitForAnimations(page);

  await page.screenshot({
    path: path.join(outDir, "settings.png"),
    fullPage: true,
  });
});
