import { describe, expect, it } from "vitest";
import { deviceOf, isBot, parseEvent, refHost, visitorHash } from "@/lib/track";

describe("parseEvent", () => {
  it("перегляд: бере шлях, чужий реферер і utm", () => {
    expect(parseEvent({ kind: "view", path: "/poslugy", ref: "https://www.google.com/search?q=x", utm: "insta" }, "gadgetfix.example")).toEqual({
      kind: "view",
      path: "/poslugy",
      name: null,
      referrer: "google.com",
      utm: "insta",
    });
  });

  it("клік без назви кнопки не приймається", () => {
    expect(parseEvent({ kind: "click", path: "/" }, "h")).toBeNull();
    expect(parseEvent({ kind: "click", path: "/", name: "hero-book" }, "h")?.name).toBe("hero-book");
  });

  it("адмінка, чужий вид події і шлях без слеша відкидаються", () => {
    expect(parseEvent({ kind: "view", path: "/admin/groshi" }, "h")).toBeNull();
    expect(parseEvent({ kind: "purchase", path: "/" }, "h")).toBeNull();
    expect(parseEvent({ kind: "view", path: "https://evil.example" }, "h")).toBeNull();
    expect(parseEvent(null, "h")).toBeNull();
  });

  it("обрізає задовгі значення", () => {
    const e = parseEvent({ kind: "click", path: "/" + "a".repeat(500), name: "n".repeat(500) }, "h");
    expect(e?.path).toHaveLength(200);
    expect(e?.name).toHaveLength(60);
  });
});

describe("refHost", () => {
  it("свій сайт і сміття — не джерело", () => {
    expect(refHost("https://www.gadgetfix.example/modeli", "gadgetfix.example")).toBeNull();
    expect(refHost("не адреса", "h")).toBeNull();
    expect(refHost(undefined, "h")).toBeNull();
  });
});

describe("visitorHash", () => {
  it("той самий відвідувач того ж дня — той самий хеш, наступного дня — інший", () => {
    const a = visitorHash("1.2.3.4", "UA", "2026-10-09", "salt");
    expect(visitorHash("1.2.3.4", "UA", "2026-10-09", "salt")).toBe(a);
    expect(visitorHash("1.2.3.4", "UA", "2026-10-10", "salt")).not.toBe(a);
    expect(a).not.toContain("1.2.3.4");
  });
});

describe("isBot і deviceOf", () => {
  it("боти й порожній user-agent не рахуються", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1")).toBe(false);
  });

  it("телефон відрізняється від комп'ютера", () => {
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(deviceOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("desktop");
  });
});
