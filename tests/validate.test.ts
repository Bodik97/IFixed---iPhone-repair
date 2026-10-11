import { describe, expect, it } from "vitest";
import { LIMITS, onlyLetters, plainText, validName } from "@/lib/validate";

/** Правила для полів форм — ті самі в браузері й на сервері */
describe("імʼя", () => {
  it("під час набору лишаються тільки літери, апостроф, дефіс і пробіл", () => {
    expect(onlyLetters("Олег123!@#")).toBe("Олег");
    expect(onlyLetters("Мар'яна-Анна  Ґонта")).toBe("Мар'яна-Анна Ґонта");
    expect(onlyLetters("<b>John</b>")).toBe("bJohnb");
    expect(onlyLetters("  Іра")).toBe("Іра");
    expect(onlyLetters("я".repeat(80))).toHaveLength(LIMITS.name.max);
  });

  it("годиться від двох літер, без цифр і знаків, не довше за ліміт", () => {
    expect(validName("Ян")).toBe(true);
    expect(validName(" Мар’яна ")).toBe(true);
    expect(validName("Я")).toBe(false);
    expect(validName("--")).toBe(false);
    expect(validName("Олег2")).toBe(false);
    expect(validName("oleg@example.com")).toBe(false);
    expect(validName("я".repeat(51))).toBe(false);
    expect(validName("")).toBe(false);
  });
});

describe("вільний текст", () => {
  it("спецсимволи й емодзі прибираються, звичайна пунктуація лишається", () => {
    expect(plainText("<script>alert(1)</script>", 100)).toBe("scriptalert(1)/script");
    expect(plainText("Не тримає заряд 😡 {10%} — вже 2-й день!", 100)).toBe("Не тримає заряд 10% — вже 2-й день!");
    expect(plainText("Тернопіль, відділення №12", 100)).toBe("Тернопіль, відділення №12");
  });

  it("обрізається до ліміту; абзаци лишаються лише там, де вони доречні", () => {
    expect(plainText("а".repeat(700), LIMITS.problem)).toHaveLength(LIMITS.problem);
    expect(plainText("рядок\n\n\n\nдругий", 100, true)).toBe("рядок\n\nдругий");
    expect(plainText("рядок\nдругий", 100)).toBe("рядок другий");
  });
});
