/**
 * Кнопка «Отримувати статус у Telegram»: відкриває бота з особистим
 * посиланням. Після «Start» клієнту приходить повідомлення на кожну зміну
 * етапу ремонту. Посилання будує сервер; без нього кнопки немає.
 */
export default function TelegramConnect({ href, className }: { href: string | null | undefined; className?: string }) {
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noopener" className={`btn btn-accent ${className ?? ""}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 4L3 11l6 2.5" />
        <path d="M21 4l-3 15-9-5.5" />
        <path d="M9 13.5V19l3.2-3.3" />
        <path d="M9 13.5L21 4" />
      </svg>
      Отримувати статус у Telegram
    </a>
  );
}
