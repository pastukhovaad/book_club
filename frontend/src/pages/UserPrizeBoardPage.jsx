import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserPrizeBoard, placeRewardOnUserBoard, removeRewardFromUserBoard, getMyRewards, getMyRewardPlacements } from "@/services/apiBook";
import PrizeBoard from "@/ui_components/PrizeBoard";
import Spinner from "@/ui_components/Spinner";


const UserPrizeBoardPage = ({ username: authUsername }) => {
  const { username } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { isPending: boardPending, isError: boardError, error: boardErrorMsg, data: boardData } = useQuery({
    queryKey: ["userPrizeBoard", username],
    queryFn: () => getUserPrizeBoard(username),
  });

  const canEditBoard = !!boardData?.can_edit || authUsername === username;

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

  const placeRewardMutation = useMutation({
    mutationFn: ({ rewardId, x, y }) => placeRewardOnUserBoard(username, { user_reward: rewardId, x, y }),
    onMutate: async ({ rewardId, x, y }) => {
      await queryClient.cancelQueries(["userPrizeBoard", username]);
      await queryClient.cancelQueries(["myRewardPlacements"]);

      const previousBoard = queryClient.getQueryData(["userPrizeBoard", username]);
      const previousPlacements = queryClient.getQueryData(["myRewardPlacements"]);
      const reward = userRewards?.find((item) => item.id === rewardId);

      if (previousBoard && reward) {
        const nextCell = {
          id: `temp-${rewardId}-${x}-${y}-${Date.now()}`,
          x,
          y,
          user_reward: reward,
          placed_by: {
            username: authUsername || "you",
          },
        };

        queryClient.setQueryData(["userPrizeBoard", username], {
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
        queryClient.setQueryData(["userPrizeBoard", username], context.previousBoard);
      }
      if (context?.previousPlacements) {
        queryClient.setQueryData(["myRewardPlacements"], context.previousPlacements);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["userPrizeBoard", username]);
      queryClient.invalidateQueries(["myRewards"]);
      queryClient.invalidateQueries(["myRewardPlacements"]);
    },
  });

  const removeRewardMutation = useMutation({
    mutationFn: ({ x, y }) => removeRewardFromUserBoard(username, x, y),
    onMutate: async ({ x, y }) => {
      await queryClient.cancelQueries(["userPrizeBoard", username]);
      await queryClient.cancelQueries(["myRewardPlacements"]);

      const previousBoard = queryClient.getQueryData(["userPrizeBoard", username]);
      const previousPlacements = queryClient.getQueryData(["myRewardPlacements"]);
      const removedRewardId = previousBoard?.cells?.find(
        (cell) => cell.x === x && cell.y === y
      )?.user_reward?.id;

      if (previousBoard) {
        queryClient.setQueryData(["userPrizeBoard", username], {
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
        queryClient.setQueryData(["userPrizeBoard", username], context.previousBoard);
      }
      if (context?.previousPlacements) {
        queryClient.setQueryData(["myRewardPlacements"], context.previousPlacements);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["userPrizeBoard", username]);
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
          Ошибка загрузки доски наград: {boardErrorMsg.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#181A2A]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <button
            onClick={() => navigate(`/profile/${username}`)}
            className="bg-[#4B6BFB] text-white py-3 px-6 rounded-md hover:bg-[#3a5ae0] transition-colors"
          >
            Назад к профилю
          </button>
        </div>

        <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#181A2A] dark:text-[#FFFFFF] mb-6">
          Доска наград {username}
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
            currentUsername={authUsername}
            isGroupMember={canEditBoard}
          />
        )}
      </div>
    </div>
  );
};

export default UserPrizeBoardPage;
