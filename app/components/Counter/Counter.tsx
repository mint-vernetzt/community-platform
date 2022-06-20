export interface CounterProps {
  currentCount: number;
  maxCount: number;
}

export function Counter({ currentCount, maxCount }: CounterProps) {
  return (
    <div className="float-right text-xs mr-12">
      Zeichenanzahl: {currentCount} / {maxCount}
    </div>
  );
}

export default Counter;
