"use client";

import { useOptimistic, useTransition } from "react";
import { setAssignee } from "./actions";
import styles from "./page.module.css";

type State = "mine" | "other" | "free";

/**
 * «Взяти собі» / «Відпустити». Напис міняється одразу — сервер підтверджує у
 * фоні, тож на повільному інтернеті кнопку не тиснуть удруге.
 */
export default function AssignButton({ id, state }: { id: string; state: State }) {
  const [shown, setShown] = useOptimistic(state);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const take = shown !== "mine";
    const form = new FormData();
    form.set("id", id);
    form.set("take", take ? "1" : "0");
    startTransition(async () => {
      setShown(take ? "mine" : "free");
      await setAssignee(form);
    });
  };

  return (
    <button type="button" className={shown === "mine" ? styles.assignMine : styles.assign} onClick={toggle}>
      {shown === "mine" ? "Відпустити" : shown === "other" ? "Забрати собі" : "Взяти собі"}
    </button>
  );
}
