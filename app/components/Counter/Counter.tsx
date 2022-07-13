export interface CounterProps {
  currentCount: number;
  maxCount: number;
}

export function Counter({ currentCount, maxCount }: CounterProps) {
  return (
    <div className="text-xs">
      Zeichenanzahl: {currentCount} / {maxCount}
    </div>
  );
}

export default Counter;
