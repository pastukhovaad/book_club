const ProgressBar = ({ percentage, height = "h-2", showLabel = false, className = "" }) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const getColor = () => {
    if (clampedPercentage === 100) return "bg-green-500";
    if (clampedPercentage >= 75) return "bg-blue-500";
    if (clampedPercentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(clampedPercentage)}%
          </span>
        </div>
      )}
      <div className={`w-full ${height} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${getColor()} transition-all duration-300 ease-out`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
