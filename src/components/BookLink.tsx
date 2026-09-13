"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type Props = {
  /** Назва послуги — саме та, що в services.ts */
  service?: string;
  model?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * «Записатись» із пам'яттю про вибір.
 *
 * Залогіненому клієнту ведемо на його сторінку: контакти там уже є, і обрана
 * послуга одразу підставиться у форму — лишиться натиснути «Замовити».
 * Решті — до форми запису на цій же сторінці, теж із підставленим вибором.
 */
export default function BookLink({ service, model, className, children }: Props) {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (model) params.set("model", model);
  const query = params.toString();

  const href = isSignedIn
    ? `/moi-remonty${query ? `?${query}` : ""}`
    : `${pathname}${query ? `?${query}` : ""}#book`;

  return (
    <Link href={href} className={className} scroll={!isSignedIn}>
      {children}
    </Link>
  );
}
