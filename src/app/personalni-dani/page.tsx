import type { Metadata } from "next";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { site } from "@/data/site";
import { owner, ownerName } from "@/data/owner";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Персональні дані — що збираємо і навіщо",
  description:
    "Які дані iFix отримує при записі на ремонт, скільки їх зберігає, кому передає і як їх забрати.",
};

/**
 * Сторінка про обробку персональних даних.
 *
 * Написана з того, що система робить насправді: поля таблиць, сервіси,
 * до яких дані доходять, і механізми, які справді існують. Обіцянки без
 * механізму тут не місце — право на видалення працює, бо в адмінці є
 * кнопка, яка прибирає заявку разом із листуванням і фото.
 */
export default function PersonalDataPage() {
  return (
    <main className={`container ${styles.page}`}>
      <BackButton fallback="/" />

      <header className={styles.head}>
        <div className="kicker">Персональні дані</div>
        <h1 className={styles.title}>Що ми про вас знаємо</h1>
        <p className={styles.lede}>
          Коротко й без юридичної мови: які дані ви нам лишаєте, навіщо вони, скільки лежать
          і як їх забрати. Сторінка описує те, що система робить насправді.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.h2}>Хто обробляє дані</h2>
        <p>
          {ownerName(site.name)}
          {owner.registry && <> · {owner.registry}</>}
          {owner.address && <> · {owner.address}</>}
        </p>
        <p>
          Звʼязок: {site.phones.map((p) => p.label).join(", ")}
          {owner.email && <> · {owner.email}</>}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Що збираємо</h2>

        <dl className={styles.list}>
          <div className={styles.row}>
            <dt>Коли записуєтесь на ремонт</dt>
            <dd>
              Імʼя, телефон, за бажанням пошта. Модель пристрою, послуга й те, що ви написали
              про несправність. Місто й відділення пошти — якщо надсилаєте пристрій.
            </dd>
          </div>

          <div className={styles.row}>
            <dt>Коли створюєте акаунт</dt>
            <dd>
              Пошта й імʼя з вашого профілю, фото — якщо воно у вас є. Сам вхід і пароль ми не
              бачимо: цим займається Clerk.
            </dd>
          </div>

          <div className={styles.row}>
            <dt>Коли пишете майстру</dt>
            <dd>
              Текст повідомлень і фото, які ви надсилаєте. Фото лежать у закритому сховищі —
              за прямим посиланням їх не відкрити.
            </dd>
          </div>

          <div className={styles.row}>
            <dt>Коли ремонт оплачено</dt>
            <dd>
              Сума, дата оплати та завдаток. Реквізити картки до нас не потрапляють — ми їх
              не приймаємо й не зберігаємо.
            </dd>
          </div>

          <div className={styles.row}>
            <dt>Коли лишаєте відгук</dt>
            <dd>
              Імʼя, місто, модель пристрою й текст. Відгук зʼявляється на сайті лише після
              того, як ми його схвалимо.
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Навіщо</h2>
        <p>
          Щоб виконати ремонт, про який ви просите: передзвонити, назвати ціну, повідомити про
          готовність, надіслати пристрій і дотримати гарантію. Без телефону ми не можемо
          зробити нічого з цього.
        </p>
        <p>
          Ми не надсилаємо рекламних розсилок, не продаємо й не передаємо дані нікому для
          реклами.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Кому дані стають доступні</h2>
        <p className={styles.note}>
          Сайт працює на чужій інфраструктурі, і ці компанії технічно мають доступ до того,
          що на ній зберігається. Кожна з них зобовʼязана захищати ці дані.
        </p>

        <ul className={styles.partners}>
          <li><b>Vercel</b> — сайт і сховище фото</li>
          <li><b>Neon</b> — база даних із заявками</li>
          <li><b>Clerk</b> — акаунти й вхід</li>
          <li><b>Нова Пошта</b> — лише адреса відділення, коли надсилаєте пристрій</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Скільки зберігаємо</h2>
        <p>
          Дані про ремонт — поки триває гарантія {site.warrantyDays} днів і ще рік після неї:
          за цей час зазвичай зʼясовується все, що може зʼясуватись. Далі вони потрібні лише
          для обліку.
        </p>
        <p>
          Але якщо ви просите видалити раніше — видаляємо, і чекати кінця строку не треба.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Ваші права</h2>
        <p>
          Ви можете дізнатися, що саме ми про вас зберігаємо, виправити помилку, забрати згоду
          або попросити все видалити.
        </p>
        <p>
          Для цього зателефонуйте{" "}
          <a href={site.phones[0].href} className={styles.link}>
            {site.phones[0].label}
          </a>
          {owner.email && (
            <>
              {" "}або напишіть на{" "}
              <a href={`mailto:${owner.email}`} className={styles.link}>
                {owner.email}
              </a>
            </>
          )}
          . Назвіть номер замовлення — і ми зробимо це того ж дня.
        </p>
        <p className={styles.note}>
          Видалення означає видалення: заявка зникає разом із листуванням і фото, не
          ховається з очей.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Коли лишаєте заявку</h2>
        <p>
          Надсилаючи форму, ви погоджуєтесь, що ми оброблятимемо ці дані так, як описано вище.
          Це потрібно, щоб виконати ремонт.
        </p>
      </section>

      <footer className={styles.foot}>
        <p>
          Питання, на які тут немає відповіді, ставте напряму — {site.phones[0].label}.
        </p>
        <Link href="/" className={styles.link}>
          На головну
        </Link>
      </footer>
    </main>
  );
}
