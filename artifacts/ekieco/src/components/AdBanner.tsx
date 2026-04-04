import { useState } from "react";
import { X } from "lucide-react";

const ADS = [
  { text: "Шиномонтаж «АвтоСервис» — быстро и качественно!", sub: "Экибастуз, ул. Горняков, 14 | Тел: +7 7187 77-00-11", color: "from-orange-500 to-orange-600" },
  { text: "Металлоприёмный пункт «ЭкиМет» — выгодные цены!", sub: "Принимаем чёрный и цветной металл | Самовывоз от 500 кг", color: "from-green-600 to-green-700" },
  { text: "Локальный бизнес Экибастуза — реклама здесь!", sub: "Разместите свою рекламу на EkiEco. Звоните: +7 7187 55-00-22", color: "from-slate-600 to-slate-700" },
];

export function AdBanner() {
  const [dismissed, setDismissed] = useState(false);
  const ad = ADS[Math.floor(Math.random() * ADS.length)];

  if (dismissed) return null;

  return (
    <div className={`relative w-full bg-gradient-to-r ${ad.color} text-white py-2 px-4`}>
      <div className="container max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Реклама</span>
          <div className="min-w-0">
            <span className="font-semibold text-sm">{ad.text}</span>
            <span className="hidden sm:inline text-white/80 text-xs ml-2">{ad.sub}</span>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Закрыть"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
