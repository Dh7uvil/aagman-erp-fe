import { expect, test } from "@playwright/test";

test.describe("mobile responsive shell", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("login page shows sign-in affordances", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in to your account/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("password visibility and remember me respond to tap", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.getByRole("textbox", { name: "Password" });
    await passwordInput.tap();
    await passwordInput.pressSequentially("secret123");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveValue("secret123");

    const showPassword = page.getByRole("button", { name: "Show password" });
    const showBox = await showPassword.boundingBox();
    expect(showBox?.width ?? 0).toBeGreaterThanOrEqual(40);
    expect(showBox?.height ?? 0).toBeGreaterThanOrEqual(40);

    await passwordInput.focus();
    const hitTarget = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el?.closest("button")?.getAttribute("aria-label") ?? null;
      },
      { x: showBox!.x + showBox!.width / 2, y: showBox!.y + showBox!.height / 2 },
    );
    expect(hitTarget).toMatch(/password/i);

    await showPassword.tap();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(passwordInput).toHaveValue("secret123");
    await page.getByRole("button", { name: "Hide password" }).tap();
    await expect(passwordInput).toHaveAttribute("type", "password");

    const rememberLabel = page.getByText("Remember me", { exact: true });
    const remember = page.getByRole("checkbox", { name: "Remember me" });
    await expect(remember).not.toBeChecked();
    await rememberLabel.tap();
    await expect(remember).toBeChecked();
    await rememberLabel.tap();
    await expect(remember).not.toBeChecked();

    await passwordInput.focus();
    await rememberLabel.tap();
    await expect(remember).toBeChecked();
  });

  test("forgot password page is usable on a narrow viewport", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });
});

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@example.com");
  await page.getByRole("textbox", { name: "Password" }).fill("secret123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}

test.describe("mobile list views", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("users list uses cards without horizontal page overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/administration/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByRole("group", { name: "List view" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Card view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(fitsViewport).toBe(true);
  });

  test("list view toggle switches to table and persists after reload", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/administration/users");
    await page.getByRole("button", { name: "Table view" }).tap();
    await expect(page.getByRole("button", { name: "Table view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator('[data-slot="table"]')).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Table view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("pagination controls meet touch target height on mobile", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/administration/users");
    const previous = page.getByRole("button", { name: "Previous page" });
    await expect(previous).toBeVisible();
    const box = await previous.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });

  test("more filters opens as a bottom sheet on narrow viewports", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/administration/users");
    await page.getByRole("button", { name: /more filters/i }).tap();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y + box.height).toBeGreaterThanOrEqual(812 - 4);
    }
  });
});

test.describe("tablet viewport", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("login marketing panel stays hidden below lg", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Secure access management")).toBeHidden();
  });
});
