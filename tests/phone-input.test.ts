import { describe, expect, it } from "vitest";
import { formatPhone, localDigits, phoneComplete } from "@/components/PhoneInput";

/** Поле телефону: «+38» стоїть завжди, а номер приймається в будь-якому звичному вигляді */
describe("поле телефону", () => {
  it("набір після +38 — цифри номера з нуля", () => {
    expect(localDigits("+38 0")).toBe("0");
    expect(localDigits("+38 073 123 45 67")).toBe("0731234567");
  });

  it("почали без нуля — нуль підставляється", () => {
    expect(localDigits("+38 7")).toBe("07");
    expect(localDigits("+38 731234567")).toBe("0731234567");
  });

  it("вставлений номер у будь-якому вигляді зводиться до одного", () => {
    for (const pasted of ["+380731234567", "380731234567", "0731234567", "+38 +380 73 123-45-67", "073 123 45 67"]) {
      expect(localDigits(pasted)).toBe("0731234567");
    }
  });

  it("зайві цифри відкидаються, залишок стертого префікса — не номер", () => {
    expect(localDigits("+38 073 123 45 67 89")).toBe("0731234567");
    expect(localDigits("+3")).toBe("");
    expect(localDigits("+")).toBe("");
    expect(localDigits("")).toBe("");
  });

  it("показується з пробілами, порожнє — лише +38", () => {
    expect(formatPhone("")).toBe("+38 ");
    expect(formatPhone("073")).toBe("+38 073");
    expect(formatPhone("0731")).toBe("+38 073 1");
    expect(formatPhone("0731234567")).toBe("+38 073 123 45 67");
  });

  it("повний номер — рівно десять цифр після +38", () => {
    expect(phoneComplete("+380731234567")).toBe(true);
    expect(phoneComplete("+38073123456")).toBe(false);
    expect(phoneComplete("")).toBe(false);
  });
});
