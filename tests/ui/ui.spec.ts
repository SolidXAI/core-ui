import { test, expect } from "@playwright/test";

test("UI: app loads", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (text.includes("favicon.ico") && text.includes("404")) {
        return;
      }
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response, "Expected navigation to return a response.").not.toBeNull();
  const status = response?.status() ?? 0;
  expect(status, `Expected UI root to respond < 400 but received ${status}.`).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();

  // expect(consoleErrors, `Console or page errors detected:\n${consoleErrors.join("\n")}`).toEqual([]);
});
