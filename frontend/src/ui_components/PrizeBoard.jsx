import { useMemo, useState } from "react";
import { resolveMediaUrl } from "@/api";

const PrizeBoard = ({
  board,
  cells,
  userRewards = [],
  placedRewardIds = [],
  onPlaceReward,
  onRemoveReward,
  canEdit = false,
  currentUsername = "",
  isGroupMember = false,
  className = ""
}) => {
  const [selectedRewardId, setSelectedRewardId] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showPlacedNames, setShowPlacedNames] = useState(true);

  const getCellContent = (x, y) => {
    return cells.find(cell => cell.x === x && cell.y === y);
  };

  const placedByUserByTemplate = useMemo(() => {
    const placedSet = new Set(placedRewardIds || []);
    return (userRewards || []).reduce((acc, reward) => {
      if (!placedSet.has(reward.id)) return acc;
      const templateId = reward?.reward_template?.id;
      if (!templateId) return acc;
      acc[templateId] = (acc[templateId] || 0) + 1;
      return acc;
    }, {});
  }, [placedRewardIds, userRewards]);

  const rewardTemplates = useMemo(() => {
    return userRewards.reduce((acc, reward) => {
      const template = reward.reward_template;
      if (!template) return acc;
      if (!acc[template.id]) {
        acc[template.id] = {
          template,
          rewards: [],
        };
      }
      acc[template.id].rewards.push(reward);
      return acc;
    }, {});
  }, [userRewards]);

  const rewardTemplateList = useMemo(() => {
    return Object.values(rewardTemplates).map(({ template, rewards }) => {
      const usedCount = placedByUserByTemplate[template.id] || 0;
      const remainingCount = Math.max(rewards.length - usedCount, 0);
      return {
        template,
        rewards,
        remainingCount,
      };
    });
  }, [rewardTemplates, placedByUserByTemplate]);

  const availableRewardIds = useMemo(() => {
    const usedRewardIds = new Set(placedRewardIds || []);
    return (userRewards || [])
      .filter((reward) => !usedRewardIds.has(reward.id))
      .map((reward) => reward.id);
  }, [placedRewardIds, userRewards]);

  const handleCellClick = (x, y) => {
    if (!isEditing || !canEdit) return;

    const cellContent = getCellContent(x, y);

    if (cellContent) {
      if (
        cellContent?.placed_by?.username === currentUsername &&
        onRemoveReward
      ) {
        onRemoveReward(x, y);
      }
      return;
    }

    if (selectedRewardId && onPlaceReward) {
      onPlaceReward({ id: selectedRewardId }, x, y);
      setSelectedRewardId(null);
    }
  };

  const handleRewardSelect = (templateId) => {
    if (!canEdit) return;
    const templateRewards = rewardTemplates[templateId]?.rewards || [];
    const availableReward = templateRewards.find((reward) =>
      availableRewardIds.includes(reward.id)
    );
    if (!availableReward) return;
    setSelectedRewardId(
      selectedRewardId === availableReward.id ? null : availableReward.id
    );
  };

  const boardTransform = "skewX(-24deg) skewY(12deg) rotateZ(-12deg)";
  const contentTransform = "skew(24deg) skewY(-12deg) rotateZ(12deg)";

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Доска фигурок
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.1))}
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
          >
            −
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(1.6, prev + 0.1))}
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
          >
            +
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setIsEditing((prev) => !prev);
                setSelectedRewardId(null);
              }}
              className={`px-4 py-2 rounded-md border transition-colors ${
                isEditing
                  ? "bg-[#4B6BFB] text-white border-[#4B6BFB]"
                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              }`}
            >
              ✎ Редактировать
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 overflow-x-auto overflow-y-auto flex-1">
          <div className="relative inline-block" style={{ paddingLeft: 200, paddingBottom: 40, paddingTop: 60 }}>
            <div
              className="relative"
              style={{
                transform: `scale(${zoom}) ${boardTransform}`,
                transformOrigin: "top left",
              }}
            >
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${board.width}, minmax(144px, 1fr))`,
                gridTemplateRows: `repeat(${board.height}, minmax(120px, 1fr))`,
              }}
            >
              {Array.from({ length: board.height }).map((_, y) =>
                Array.from({ length: board.width }).map((_, x) => {
                  const cellContent = getCellContent(x, y);
                  const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
                  const canPlace = isEditing && canEdit && selectedRewardId && !cellContent;
                  const canRemove =
                    isEditing &&
                    canEdit &&
                    cellContent?.placed_by?.username === currentUsername;

                  const rewardName = cellContent?.user_reward?.reward_template?.name;
                  const rewardImage = cellContent?.user_reward?.reward_template?.image;
                  const placedByUsername = cellContent?.placed_by?.username;
                  const isOwnPlacement = placedByUsername === currentUsername;
                  const borderColor = !isEditing
                    ? "#a1a1a1"
                    : cellContent
                      ? isOwnPlacement
                        ? "#22c55e"
                        : "#ef4444"
                      : "#a1a1a1";

                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`
                        aspect-square flex items-center justify-center
                        transition-all cursor-pointer relative overflow-hidden
                        ${cellContent ? "bg-white" : "bg-white"}
                        ${isHovered && canPlace ? "ring-2 ring-blue-400" : ""}
                        ${isEditing ? "hover:ring-2 hover:ring-blue-300" : ""}
                      `}
                      style={{ border: `3px solid ${borderColor}` }}
                      onClick={() => handleCellClick(x, y)}
                      onMouseEnter={() => setHoveredCell({ x, y })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={cellContent
                        ? `${rewardName || "Фигурка"} (от ${cellContent?.placed_by?.username || ""})`
                        : canPlace
                          ? "Нажмите, чтобы разместить"
                          : ""
                      }
                    >
                      {canRemove && rewardImage && (
                        <div
                          className="absolute left-1/2 top-1/2 pointer-events-none"
                          style={{
                            transform: `translate(-62%, -95%) ${contentTransform}`,
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onRemoveReward?.(x, y);
                            }}
                            className="pointer-events-auto absolute top-0 right-0 w-6 h-6 rounded-full bg-white/90 text-red-500 text-sm flex items-center justify-center shadow"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div
              className="absolute inset-0 grid gap-2 pointer-events-none"
              style={{
                gridTemplateColumns: `repeat(${board.width}, minmax(52px, 1fr))`,
                gridTemplateRows: `repeat(${board.height}, minmax(60px, 1fr))`,
              }}
            >
              {Array.from({ length: board.height }).map((_, y) =>
                Array.from({ length: board.width }).map((_, x) => {
                  const cellContent = getCellContent(x, y);
                  const rewardImage = cellContent?.user_reward?.reward_template?.image;
                  const rewardName = cellContent?.user_reward?.reward_template?.name;
                  const placedByUsername = cellContent?.placed_by?.username;
                  const isOwnPlacement = placedByUsername === currentUsername;
                  const canShowNames = isGroupMember
                    ? isEditing && showPlacedNames
                    : showPlacedNames;

                  return (
                    <div key={`overlay-${x}-${y}`} className="relative">
                      {rewardImage && (
                        <div
                          className="absolute left-1/2 top-1/2"
                          style={{
                            transform: `translate(-62%, -95%) ${contentTransform}`,
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <img
                            src={resolveMediaUrl(rewardImage)}
                            alt={rewardName || "Reward"}
                            className="w-full h-full object-contain"
                          />
                          {canShowNames && placedByUsername && !isOwnPlacement && (
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-white/70 text-black text-sm font-semibold shadow">
                              {placedByUsername}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          </div>
        </div>

        {canEdit && isEditing && (
          <div className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 w-full lg:w-72">
            <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Ваши фигурки
            </h4>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
              <input
                type="checkbox"
                checked={showPlacedNames}
                onChange={(event) => setShowPlacedNames(event.target.checked)}
              />
              Показывать имена владельцев
            </label>
            {rewardTemplateList.length > 0 ? (
              <div className="flex gap-4 flex-wrap">
                {rewardTemplateList.map((entry) => {
                  const isDisabled = entry.remainingCount === 0;
                  return (
                    <button
                      key={entry.template.id}
                      type="button"
                      className={`flex flex-col items-center gap-2 p-2 rounded-md border transition-all ${
                        isDisabled
                          ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      } ${
                        selectedRewardId &&
                        entry.rewards.some((reward) => reward.id === selectedRewardId)
                          ? "ring-2 ring-blue-400"
                          : ""
                      }`}
                      onClick={() => handleRewardSelect(entry.template.id)}
                      disabled={isDisabled}
                      title={entry.template.name}
                    >
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={resolveMediaUrl(entry.template.image)}
                          alt={entry.template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Осталось: {entry.remainingCount}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                У вас пока нет фигурок для размещения.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizeBoard;
