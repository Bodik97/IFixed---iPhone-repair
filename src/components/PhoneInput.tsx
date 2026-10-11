"use client";

/**
 * Поле телефону з незмінним «+38».
 *
 * Людина одразу бачить, з чого починати, і вводить номер так, як звикла:
 * 073…, 73…, вставляє +380 73… чи 380 73… — усе зводиться до одного вигляду
 * «+38 073 123 45 67». У заявку йде «+380731234567».
 */

const PREFIX = "+38";

/** Те, що набрано чи вставлено → десять цифр номера, починаючи з нуля */
export function localDigits(raw: string): string {
  let d = (raw.startsWith(PREFIX) ? raw.slice(PREFIX.length) : raw).replace(/\D/g, "");

  // Вставили номер повністю, з кодом країни — прибираємо «38»
  if (d.startsWith("380")) d = d.slice(2);
  // Залишок стертого префікса («+3», «+»): це ще не цифри номера
  else if (!raw.startsWith(PREFIX) && /^(38?|8)$/.test(d)) d = "";

  // Після +38 номер завжди починається з нуля — підставляємо, якщо почали з 73…
  if (d && d[0] !== "0") d = `0${d}`;
  return d.slice(0, 10);
}

/** 0731234567 → «+38 073 123 45 67»; неповний номер — скільки вже є */
export function formatPhone(local: string): string {
  const parts = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 8), local.slice(8, 10)].filter(Boolean);
  return `${PREFIX} ${parts.join(" ")}`;
}

/** Номер набрано повністю? */
export const phoneComplete = (value: string) => localDigits(value).length === 10;

export default function PhoneInput({
  value,
  onChange,
  ...rest
}: {
  /** «+380731234567» або частина; порожній рядок — ще нічого не введено */
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <input
      className="field"
      {...rest}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={formatPhone(localDigits(value))}
      onChange={(e) => {
        const local = localDigits(e.target.value);
        onChange(local ? `${PREFIX}${local}` : "");
      }}
    />
  );
}
