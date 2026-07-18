"use client";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 160,
  strokeWidth = 8,
  label,
  sublabel,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className || ""}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E0ED"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#5B6ABF"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center label */}
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-text-primary">
          {Math.round(progress)}%
        </span>
        {label && (
          <span className="text-xs text-text-secondary mt-1">{label}</span>
        )}
      </div>
      {sublabel && (
        <span className="text-sm text-text-secondary mt-2">{sublabel}</span>
      )}
    </div>
  );
}
