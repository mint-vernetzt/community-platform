export interface CounterProps {
  currentCount: number;
  maxCount: number;
}

export function Counter({ currentCount, maxCount }: CounterProps) {
  return (
    <div className="mv-text-sm mv-text-gray-700">
      {currentCount}/{maxCount}
    </div>
  );
}

export default Counter;
