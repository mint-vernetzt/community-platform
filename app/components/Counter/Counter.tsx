import { useTranslation } from "react-i18next";

export interface CounterProps {
  currentCount: number;
  maxCount: number;
}

export function Counter({ currentCount, maxCount }: CounterProps) {
  const { t } = useTranslation(["components/counter"]);
  return (
    <div className="text-xs">
      {t("counter.numberOfChars", { current: currentCount, total: maxCount })}
    </div>
  );
}

export default Counter;
