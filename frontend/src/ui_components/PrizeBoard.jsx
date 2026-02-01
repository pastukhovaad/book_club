import { useState } from "react";
import { BASE_URL } from "@/api";

const PrizeBoard = ({
  board,
  cells,
  userRewards = [],
  onPlaceReward,
  onRemoveReward,
  canEdit = false,
  className = ""
}) => {
  const [selectedReward, setSelectedReward] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const getCellContent = (x, y) => {
    return cells.find(cell => cell.x === x && cell.y === y);
  };

  const handleCellClick = (x, y) => {
    const cellContent = getCellContent(x, y);

    if (cellContent) {
      // Cell has content - remove if allowed
      if (canEdit && onRemoveReward) {
        onRemoveReward(x, y);
      }
    } else if (selectedReward && canEdit && onPlaceReward) {
      // Empty cell and reward selected - place it
      onPlaceReward(selectedReward, x, y);
      setSelectedReward(null);
    }
  };

  const handleRewardSelect = (reward) => {
    if (canEdit) {
      setSelectedReward(selectedReward?.id === reward.id ? null : reward);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Prize Board Grid */}
      <div className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Доска призов
        </h3>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${board.width}, minmax(60px, 1fr))`,
            gridTemplateRows: `repeat(${board.height}, minmax(60px, 1fr))`
          }}
        >
          {Array.from({ length: board.height }).map((_, y) =>
            Array.from({ length: board.width }).map((_, x) => {
              const cellContent = getCellContent(x, y);
              const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
              const canPlace = canEdit && selectedReward && !cellContent;

              return (
                <div
                  key={`${x}-${y}`}
                  className={`
                    aspect-square border-2 rounded-md flex items-center justify-center
                    transition-all cursor-pointer
                    ${cellContent
                      ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                    }
                    ${isHovered && canPlace ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                    ${canEdit ? 'hover:border-blue-400 dark:hover:border-blue-500' : ''}
                  `}
                  onClick={() => handleCellClick(x, y)}
                  onMouseEnter={() => setHoveredCell({ x, y })}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={cellContent
                    ? `${cellContent.reward_template.name} (от ${cellContent.placed_by.username})`
                    : canPlace
                      ? 'Нажмите, чтобы разместить'
                      : ''
                  }
                >
                  {cellContent && (
                    <div className="w-full h-full p-1">
                      <img
                        src={`${BASE_URL}${cellContent.reward_template.image}`}
                        alt={cellContent.reward_template.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* User Rewards Selection (only if canEdit) */}
      {canEdit && userRewards.length > 0 && (
        <div className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Ваши награды (выберите для размещения)
          </h4>
          <div className="flex gap-3 flex-wrap">
            {userRewards.map((reward) => (
              <div
                key={reward.id}
                className={`
                  w-20 h-20 border-2 rounded-md cursor-pointer transition-all
                  ${selectedReward?.id === reward.id
                    ? 'border-blue-500 dark:border-blue-400 shadow-lg'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }
                `}
                onClick={() => handleRewardSelect(reward)}
                title={reward.reward_template.name}
              >
                <img
                  src={`${BASE_URL}${reward.reward_template.image}`}
                  alt={reward.reward_template.name}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeBoard;
