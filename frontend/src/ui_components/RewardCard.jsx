import { BASE_URL } from "@/api";

const RewardCard = ({ reward, showReceivedDate = true, className = "" }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`px-4 py-4 rounded-md w-[250px] h-auto flex flex-col gap-3 dark:border-gray-800 border shadow-lg ${className}`}>
      <div className="w-full h-[180px] border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={`${BASE_URL}${reward.reward_template.image}`}
          alt={reward.reward_template.name}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      <h3 className="font-semibold text-[#181A2A] dark:text-white text-center">
        {reward.reward_template.name}
      </h3>

      {reward.quest_completed && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          За: {reward.quest_completed.quest.title}
        </p>
      )}

      {showReceivedDate && (
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          Получено: {formatDate(reward.received_at)}
        </p>
      )}
    </div>
  );
};

export default RewardCard;
