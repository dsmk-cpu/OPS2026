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

    test("keeps continue button disabled for invalid license plate", async ({ page }) => {
        await page.goto("/");

        const input = page.getByLabel("Kennzeichen");
        const continueButton = page.getByRole("button", {
            name: "Weiter zur Zahlung",
        });

        await input.fill("ABC");

        await expect(continueButton).toBeDisabled();
    });

    test("shows payment information after entering a valid license plate", async ({ page }) => {
        await page.goto("/");

        await page
            .getByLabel("Kennzeichen")
            .fill("M-XY 1234");

        const continueButton = page.getByRole("button", {
            name: "Weiter zur Zahlung",
        });

        await expect(continueButton).toBeEnabled();

        await continueButton.click();

        await expect(
            page.getByText("M-XY 1234"),
        ).toBeVisible();

        await expect(
            page.getByText("12,50 €", { exact: true }),
        ).toBeVisible();

        await expect(
            page.getByRole("button", {
                name: "12,50 € bezahlen",
            }),
        ).toBeVisible();
    });

    test("completes payment after status changes from PENDING to PAID", async ({ page }) => {
        let statusRequestCount = 0;

        await page.route("**/parkpay/v1", async (route) => {
            if (route.request().method() === "POST") {
                await route.fulfill({
                    status: 201,
                    contentType: "application/json",
                    body: JSON.stringify({
                        id: "payment-1",
                        parkingId: 123,
                        status: "PENDING",
                        created: true,
                    }),
                });

                return;
            }

            await route.continue();
        });

        await page.route("**/parkpay/v1/*", async (route) => {
            statusRequestCount++;

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    id: "payment-1",
                    parkingId: 123,
                    status:
                        statusRequestCount >= 2
                            ? "PAID"
                            : "PENDING",
                }),
            });
        });

        await page.goto("/");

        await page
            .getByLabel("Kennzeichen")
            .fill("M-XY 1234");

        await page
            .getByRole("button", {
                name: "Weiter zur Zahlung",
            })
            .click();

        await page
            .getByRole("button", {
                name: "12,50 € bezahlen",
            })
            .click();

        await expect(
            page.getByText("Zahlung wird verarbeitet..."),
        ).toBeVisible();

        await expect(
            page.getByRole("heading", {
                name: "Zahlung erfolgreich",
            }),
        ).toBeVisible({
            timeout: 7000,
        });

        await expect(
            page.getByText("M-XY 1234"),
        ).toBeVisible();
    });
});