import "server-only";

/** Коди Нової Пошти «відправлення отримано»: 9 — отримано, 10 і 11 — отримано, і післяплата в дорозі чи виплачена */
const RECEIVED = new Set(["9", "10", "11"]);

/**
 * Чи забрав клієнт посилку. Відстеження за номером накладної Нова Пошта
 * віддає без ключа. null — дізнатися не вдалося (звʼязок, відмова): це не
 * «ні», тож наступна перевірка спробує знову.
 */
export async function parcelReceived(ttn: string): Promise<boolean | null> {
  try {
    const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: process.env.NOVA_POSHTA_API_KEY?.trim() ?? "",
        modelName: "TrackingDocument",
        calledMethod: "getStatusDocuments",
        methodProperties: { Documents: [{ DocumentNumber: ttn.replace(/\D/g, ""), Phone: "" }] },
      }),
    });
    const body = (await res.json()) as { success?: boolean; data?: { StatusCode?: string }[] };
    const code = body.success ? body.data?.[0]?.StatusCode : undefined;
    return code === undefined ? null : RECEIVED.has(String(code));
  } catch (e) {
    console.error("[nova-poshta] статус не отримано:", e);
    return null;
  }
}
