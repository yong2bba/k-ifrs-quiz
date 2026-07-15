import { describe, expect, it } from "vitest";
import { questions, topics } from "../src/questions.js";

describe("K-IFRS quiz data", () => {
  it("contains the 22 completed learning cases", () => {
    expect(questions).toHaveLength(22);
    expect(new Set(questions.map((question) => question.id)).size).toBe(22);
  });

  it("has one valid answer and official authority references per question", () => {
    for (const question of questions) {
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(question.correct).toBeGreaterThanOrEqual(0);
      expect(question.correct).toBeLessThan(question.options.length);
      expect(question.answer.length).toBeGreaterThan(2);
      expect(question.explanation.length).toBeGreaterThan(20);
      expect(question.references.length).toBeGreaterThan(0);

      for (const reference of question.references) {
        expect(reference.paragraphs).toMatch(/문단|부록|B\d|\d/);
        expect(new URL(reference.url).hostname).toBe("www.ifrs.org");
        expect(new URL(reference.kasbUrl).hostname).toBe("www.kasb.or.kr");
      }
    }
  });

  it("keeps the topic index in sync with question data", () => {
    expect(topics).toEqual([...new Set(questions.map((question) => question.topic))]);
    expect(topics).toContain("외화");
    expect(topics).toContain("리스");
  });
});
