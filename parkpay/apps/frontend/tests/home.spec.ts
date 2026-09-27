import { expect, test } from "@playwright/test";

test.describe("ParkPay Homepage", () => {
    test("shows the ParkPay payment page", async ({ page }) => {
        await page.goto("/");

        await expect(
            page.getByRole("heading", {
                name: "Parkgebühr bezahlen",
            }),
        ).toBeVisible();

        await expect(
            page.getByLabel("Kennzeichen"),
        ).toBeVisible();

        await expect(
            page.getByRole("button", {
                name: "Weiter zur Zahlung",
            }),
        ).toBeDisabled();
    });

    test("enables payment after entering a license plate", async ({ page }) => {
        await page.goto("/");

        const licensePlateInput = page.getByLabel("Kennzeichen");

        const continueButton = page.getByRole("button", {
            name: "Weiter zur Zahlung",
        });

        await licensePlateInput.fill("M-XY 1234");

        await expect(continueButton).toBeEnabled();

        await continueButton.click();

        await expect(
            page.getByText("M-XY 1234"),
        ).toBeVisible();

        await expect(
            page.getByRole("button", {
                name: "PayPal",
            }),
        ).toBeVisible();
    });
});