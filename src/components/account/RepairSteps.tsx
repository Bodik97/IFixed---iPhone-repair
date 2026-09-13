import { STAGES, type StatusInfo } from "@/db/leads";
import styles from "./RepairSteps.module.css";

/**
 * Шкала ремонту: Прийнято → Діагностика → Ремонт → Готово.
 * Стан позначаємо не лише кольором, а й галочкою та підписом — вимога
 * доступності, і так само зрозуміліше при денному світлі на вулиці.
 */
export default function RepairSteps({ status }: { status: StatusInfo }) {
  // Відмова не лягає на шкалу: ремонту не було
  if (status.stage < 0) return null;

  return (
    <ol className={styles.steps} aria-label="Етап ремонту">
      {STAGES.map((label, i) => {
        const done = i < status.stage;
        const now = i === status.stage;

        return (
          <li
            key={label}
            className={done ? styles.done : now ? styles.now : styles.todo}
            aria-current={now ? "step" : undefined}
          >
            <span className={styles.mark} aria-hidden="true">
              {done ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : now ? (
                <span className={styles.pulse} />
              ) : null}
            </span>

            <span className={styles.label}>{label}</span>
            {now && <span className="visually-hidden">— поточний етап</span>}
          </li>
        );
      })}
    </ol>
  );
}
