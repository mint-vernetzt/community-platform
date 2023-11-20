export interface CounterProps {
  currentCount: number;
  maxCount: number;
}

export function Counter({ currentCount, maxCount }: CounterProps) {
  return (
    <div
      className={`mv-text-sm ${
        currentCount < maxCount ? "mv-text-gray-700" : "mv-text-negative-600"
      }`}
    >
      {currentCount}/{maxCount}
    </div>
  );
}

export default Counter;
