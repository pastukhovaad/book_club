import { useQuery } from "@tanstack/react-query";
import { getMyRewards, getUserRewards } from "@/services/apiBook";
import RewardCard from "@/ui_components/RewardCard";
import Spinner from "@/ui_components/Spinner";
import { useSearchParams } from "react-router-dom";

const RewardsPage = () => {
  const [searchParams] = useSearchParams();
  const username = searchParams.get("user");

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["userRewards", username || "me"],
    queryFn: () => (username ? getUserRewards(username) : getMyRewards()),
  });

  if (isPending) {
    return (
      <div className="padding-y max-container flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="padding-y max-container">
        <div className="text-red-500 text-center">
          Ошибка загрузки наград: {error.message}
        </div>
      </div>
    );
  }

  const rewards = data || [];

  return (
    <div className="padding-y max-container">
      <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
        {username ? `Награды пользователя ${username}` : "Мои награды"}
      </h2>

      {rewards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            {username ? "У пользователя пока нет наград" : "У вас пока нет наград"}
          </p>
          <p className="text-gray-400 dark:text-gray-500">
            Выполняйте задания, чтобы получить награды!
          </p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Всего наград: {rewards.length}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;
