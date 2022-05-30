export interface CounterProps {
  currentCount: number;
  maxCount: number;
}

export function Counter({ currentCount, maxCount }: CounterProps) {
  return (
    <div>
      {currentCount} / {maxCount}
    </div>
  );
}

export default Counter;
