import { NextResponse } from "next/server";

export type Order = {
  no: string;
  device: string;
  work: string;
  stage: number;
  stages: string[];
  eta: string;
  log: { time: string; text: string }[];
};

// Заглушка до підключення CRM замовника: структура відповіді вже фінальна.
function stubOrder(no: string): Order {
  return {
    no,
    device: "iPhone 13",
    work: "Заміна екрана",
    stage: 2,
    stages: ["Прийнято", "Діагностика", "Ремонт", "Готово"],
    eta: "сьогодні до 18:00",
    log: [
      { time: "09:20", text: "Прийняли пристрій, оформили квитанцію" },
      { time: "10:05", text: "Діагностика: пошкоджений дисплейний модуль" },
      { time: "10:30", text: "Погодили фіксовану ціну, почали ремонт" },
    ],
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  const clean = no.trim();

  if (!/^\d{1,10}$/.test(clean)) {
    return NextResponse.json({ error: "Номер замовлення — лише цифри з квитанції" }, { status: 400 });
  }

  return NextResponse.json(stubOrder(clean));
}
