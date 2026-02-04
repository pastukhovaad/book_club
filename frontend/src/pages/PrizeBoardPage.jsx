import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPrizeBoard, placeRewardOnBoard, removeRewardFromBoard, getMyRewards, getMyRewardPlacements } from "@/services/apiBook";
import PrizeBoard from "@/ui_components/PrizeBoard";
import Spinner from "@/ui_components/Spinner";

const PrizeBoardPage = ({ username }) => {
  const { slug } = useParams();
  const queryClient = useQueryClient();

  // Fetch prize board
  const { isPending: boardPending, isError: boardError, error: boardErrorMsg, data: boardData } = useQuery({
    queryKey: ["prizeBoard", slug],
    queryFn: () => getPrizeBoard(slug),
  });

  const canEditBoard = !!boardData?.can_edit || username === boardData?.reading_group?.creator?.username;

  // Fetch user's rewards
  const { data: userRewards } = useQuery({
    queryKey: ["myRewards"],
    queryFn: getMyRewards,
    enabled: canEditBoard,
  });

  const { data: rewardPlacements } = useQuery({
    queryKey: ["myRewardPlacements"],
    queryFn: getMyRewardPlacements,
    enabled: canEditBoard,
  });

  // Place reward mutation
  const placeRewardMutation = useMutation({
    mutationFn: ({ rewardId, x, y }) => placeRewardOnBoard(slug, { user_reward: rewardId, x, y }),
    onMutate: async ({ rewardId, x, y }) => {
      await queryClient.cancelQueries(["prizeBoard", slug]);
      await queryClient.cancelQueries(["myRewardPlacements"]);

      const previousBoard = queryClient.getQueryData(["prizeBoard", slug]);
      const previousPlacements = queryClient.getQueryData(["myRewardPlacements"]);
      const reward = userRewards?.find((item) => item.id === rewardId);

      if (previousBoard && reward) {
        const nextCell = {
          id: `temp-${rewardId}-${x}-${y}-${Date.now()}`,
          x,
          y,
          user_reward: reward,
          placed_by: {
            username: username || "you",
          },
        };

        queryClient.setQueryData(["prizeBoard", slug], {
          ...previousBoard,
          cells: [
            ...(previousBoard.cells || []).filter(
              (cell) => !(cell.x === x && cell.y === y)
            ),
            nextCell,
          ],
        });
      }

      if (previousPlacements?.placed_reward_ids && !previousPlacements.placed_reward_ids.includes(rewardId)) {
        queryClient.setQueryData(["myRewardPlacements"], {
          ...previousPlacements,
          placed_reward_ids: [...previousPlacements.placed_reward_ids, rewardId],
        });
      }

      return { previousBoard, previousPlacements };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["prizeBoard", slug], context.previousBoard);
      }
      if (context?.previousPlacements) {
        queryClient.setQueryData(["myRewardPlacements"], context.previousPlacements);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["prizeBoard", slug]);
      queryClient.invalidateQueries(["myRewards"]);
      queryClient.invalidateQueries(["myRewardPlacements"]);
    },
  });

  // Remove reward mutation
  const removeRewardMutation = useMutation({
    mutationFn: ({ x, y }) => removeRewardFromBoard(slug, x, y),
    onMutate: async ({ x, y }) => {
      await queryClient.cancelQueries(["prizeBoard", slug]);
      await queryClient.cancelQueries(["myRewardPlacements"]);

      const previousBoard = queryClient.getQueryData(["prizeBoard", slug]);
      const previousPlacements = queryClient.getQueryData(["myRewardPlacements"]);
      const removedRewardId = previousBoard?.cells?.find(
        (cell) => cell.x === x && cell.y === y
      )?.user_reward?.id;

      if (previousBoard) {
        queryClient.setQueryData(["prizeBoard", slug], {
          ...previousBoard,
          cells: (previousBoard.cells || []).filter(
            (cell) => !(cell.x === x && cell.y === y)
          ),
        });
      }

      if (previousPlacements?.placed_reward_ids && removedRewardId) {
        queryClient.setQueryData(["myRewardPlacements"], {
          ...previousPlacements,
          placed_reward_ids: previousPlacements.placed_reward_ids.filter(
            (id) => id !== removedRewardId
          ),
        });
      }

      return { previousBoard, previousPlacements };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["prizeBoard", slug], context.previousBoard);
      }
      if (context?.previousPlacements) {
        queryClient.setQueryData(["myRewardPlacements"], context.previousPlacements);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["prizeBoard", slug]);
      queryClient.invalidateQueries(["myRewards"]);
      queryClient.invalidateQueries(["myRewardPlacements"]);
    },
  });

  const handlePlaceReward = (reward, x, y) => {
    placeRewardMutation.mutate({ rewardId: reward.id, x, y });
  };

  const handleRemoveReward = (x, y) => {
    removeRewardMutation.mutate({ x, y });
  };

  if (boardPending) {
    return (
      <div className="padding-y max-container flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (boardError) {
    return (
      <div className="padding-y max-container">
        <div className="text-red-500 text-center">
          Ошибка загрузки доски призов: {boardErrorMsg.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#181A2A]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <Link
            to={`/groups/${slug}`}
            className="text-[#4B6BFB]"
          >
            ← Назад к группе
          </Link>
        </div>
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#181A2A] dark:text-[#FFFFFF] mb-6">
          Доска наград группы "{boardData?.reading_group?.name}"
        </h2>

        {placeRewardMutation.isError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 rounded-md text-red-700 dark:text-red-400">
            {placeRewardMutation.error.message}
          </div>
        )}

        {removeRewardMutation.isError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 rounded-md text-red-700 dark:text-red-400">
            {removeRewardMutation.error.message}
          </div>
        )}

        {boardData && (
          <PrizeBoard
            board={boardData}
            cells={boardData.cells || []}
            userRewards={userRewards || []}
            placedRewardIds={rewardPlacements?.placed_reward_ids || []}
            onPlaceReward={handlePlaceReward}
            onRemoveReward={handleRemoveReward}
            canEdit={canEditBoard}
            currentUsername={username}
            isGroupMember={canEditBoard}
          />
        )}
      </div>
    </div>
  );
};

export default PrizeBoardPage;
