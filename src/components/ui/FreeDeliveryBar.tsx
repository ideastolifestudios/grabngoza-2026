// FreeDeliveryBar.tsx
// Drop-in replacement. Prop changes: remove cartCount, add amount (Rands).
// Usage: <FreeDeliveryBar amount={cartTotal} />

type FreeDeliveryBarProps = {
  amount: number;
  threshold?: number; // default R500
};

export default function FreeDeliveryBar({ amount, threshold = 500 }: FreeDeliveryBarProps) {
  const remaining = Math.max(0, threshold - amount);
  const progress  = Math.min(100, (amount / threshold) * 100);
  const achieved  = remaining === 0;

  return (
    <div className="w-full px-4 py-2 bg-[#06402B]/5 border-b border-[#06402B]/10">
      <div className="max-w-7xl mx-auto">
        {/* Text */}
        <p className="text-xs text-center text-[#06402B] font-medium mb-1.5">
          {achieved
            ? "🎉 You've unlocked free delivery!"
            : `Add R${remaining.toFixed(0)} more for free delivery`}
        </p>

        {/* Progress bar */}
        <div className="h-1 bg-[#06402B]/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#06402B] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
