export interface CounterProps {
  currentCount: number;
  maxCount: number;
}

export function Counter({ currentCount, maxCount }: CounterProps) {
  return (
    <div
      className={`text-sm ${
        currentCount < maxCount ? "text-gray-700" : "text-negative-600"
      }`}
    >
      {currentCount}/{maxCount}
    </div>
  );
}

export default Counter;
