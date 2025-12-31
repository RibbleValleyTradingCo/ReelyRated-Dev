import { test, expect, type Page } from "@playwright/test";
import { loginViaUi } from "./helpers/auth";

const waitForTheme = async (page: Page, theme: "light" | "dark") => {
  if (theme === "dark") {
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  } else {
    await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));
  }
};

const disableMotion = async (page: Page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
};

const openProfileFromMenu = async (page: Page) => {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByText("View profile", { exact: true }).click();
  await page.waitForURL(/\/profile\//);
  await expect(page.getByRole("heading", { name: "Angler stats" })).toBeVisible();
};

const capture = async (page: Page, path: string, name: string, readyHeading: string) => {
  await page.goto(path);
  await expect(page.getByRole("heading", { name: readyHeading })).toBeVisible();
  await expect(page).toHaveScreenshot(name, { fullPage: true });
};

test.describe("visual regression - light mode", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("insights, profile settings, profile", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await loginViaUi(page);
    await waitForTheme(page, "light");
    await disableMotion(page);

    await capture(page, "/insights", "insights-light.png", "Your angling insights");
    await capture(page, "/settings/profile", "profile-settings-light.png", "Profile settings");

    await openProfileFromMenu(page);
    await expect(page).toHaveScreenshot("profile-light.png", { fullPage: true });
  });
});

test.describe("visual regression - dark mode", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("insights, profile settings, profile", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await loginViaUi(page);
    await disableMotion(page);

    await page.getByTestId("theme-toggle").click();
    await waitForTheme(page, "dark");

    await capture(page, "/insights", "insights-dark.png", "Your angling insights");
    await capture(page, "/settings/profile", "profile-settings-dark.png", "Profile settings");

    await openProfileFromMenu(page);
    await expect(page).toHaveScreenshot("profile-dark.png", { fullPage: true });
  });
});
