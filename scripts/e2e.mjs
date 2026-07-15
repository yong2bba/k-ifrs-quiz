import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173/";
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
await page.goto(baseUrl, { waitUntil: "networkidle" });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert((await page.title()) === "K-IFRS 판정실", "page title mismatch");
assert((await page.locator(".answer-button").count()) === 4, "first question options missing");
const initialA11y = await new AxeBuilder({ page }).analyze();
const seriousInitial = initialA11y.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
assert(seriousInitial.length === 0, `initial accessibility violations: ${seriousInitial.map((item) => `${item.id}(${item.nodes.map((node) => node.target.join(" ")).join(";")})`).join(", ")}`);

await page.locator(".answer-button").first().click();
assert((await page.locator("#verdict-title").textContent()).includes("다시 볼"), "wrong answer verdict missing");
assert((await page.locator(".evidence-panel li").count()) >= 1, "authority evidence missing");
assert((await page.locator('a[href*="ifrs.org"]').count()) >= 1, "official IFRS link missing");
assert((await page.locator('a[href*="kasb.or.kr"]').count()) >= 1, "official KASB link missing");
const verdictA11y = await new AxeBuilder({ page }).analyze();
const seriousVerdict = verdictA11y.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
assert(seriousVerdict.length === 0, `verdict accessibility violations: ${seriousVerdict.map((item) => `${item.id}(${item.nodes.map((node) => node.target.join(" ")).join(";")})`).join(", ")}`);

await page.getByRole("button", { name: "다음 문제 →" }).click();
await page.locator(".answer-button").nth(1).click();
assert((await page.locator("#verdict-title").textContent()).includes("정답"), "correct answer verdict missing");
assert((await page.locator(".score-line strong").textContent()) === "1", "score did not update");

await page.getByRole("button", { name: /외화/ }).click();
assert((await page.locator(".case-header h1").textContent()).includes("외화"), "topic filter did not navigate to FX questions");

await mkdir("artifacts", { recursive: true });
await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });
assert((await page.locator(".answer-button").count()) >= 2, "mobile quiz options missing");
const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
assert(!mobileOverflow, "mobile page has horizontal overflow");
const smallestAnswerHeight = await page.locator(".answer-button").evaluateAll((buttons) => Math.min(...buttons.map((button) => button.getBoundingClientRect().height)));
assert(smallestAnswerHeight >= 44, "answer touch targets are smaller than 44px");
await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });

assert(errors.length === 0, `console errors: ${errors.join(" | ")}`);

console.log("E2E_OK title/options/wrong-verdict/evidence-links/correct-score/topic-filter/mobile");
await browser.close();
