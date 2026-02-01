import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPrizeBoard, placeRewardOnBoard, removeRewardFromBoard, getMyRewards } from "@/services/apiBook";
import PrizeBoard from "@/ui_components/PrizeBoard";
import Spinner from "@/ui_components/Spinner";

const PrizeBoardPage = () => {
  const { slug } = useParams();
  const queryClient = useQueryClient();

  // Fetch prize board
  const { isPending: boardPending, isError: boardError, error: boardErrorMsg, data: boardData } = useQuery({
    queryKey: ["prizeBoard", slug],
    queryFn: () => getPrizeBoard(slug),
  });

  // Fetch user's rewards
  const { data: userRewards } = useQuery({
    queryKey: ["myRewards"],
    queryFn: getMyRewards,
  });

  // Place reward mutation
  const placeRewardMutation = useMutation({
    mutationFn: ({ rewardId, x, y }) => placeRewardOnBoard(slug, { reward_id: rewardId, x, y }),
    onSuccess: () => {
      queryClient.invalidateQueries(["prizeBoard", slug]);
      queryClient.invalidateQueries(["myRewards"]);
    },
  });

  // Remove reward mutation
  const removeRewardMutation = useMutation({
    mutationFn: ({ x, y }) => removeRewardFromBoard(slug, x, y),
    onSuccess: () => {
      queryClient.invalidateQueries(["prizeBoard", slug]);
      queryClient.invalidateQueries(["myRewards"]);
    },
  });

  const handlePlaceReward = (reward, x, y) => {
    placeRewardMutation.mutate({ rewardId: reward.id, x, y });
  };

  const handleRemoveReward = (x, y) => {
    if (window.confirm("Вы уверены, что хотите убрать эту награду с доски?")) {
      removeRewardMutation.mutate({ x, y });
    }
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
    <div className="padding-y max-container">
      <div className="max-w-4xl mx-auto">
        <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
          Доска призов
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
            onPlaceReward={handlePlaceReward}
            onRemoveReward={handleRemoveReward}
            canEdit={true}
          />
        )}
      </div>
    </div>
  );
};

export default PrizeBoardPage;
