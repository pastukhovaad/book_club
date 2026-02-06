import { Link } from "react-router-dom";
import ProgressBar from "./ProgressBar";
import { resolveMediaUrl } from "@/api";

const QuestCard = ({ quest, userProgress = null, className = "" }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      month: "short",
      day: "numeric",
    });
  };

  const getQuestTypeLabel = (type) => {
    const labels = {
      read_books: "Прочитать книги",
      create_comments: "Оставить комментарии",
      reply_comments: "Ответить на комментарии",
      place_rewards: "Разместить призы",
    };
    return labels[type] || type;
  };

  const getParticipationTypeLabel = (type) => {
    const labels = {
      personal: "Личное",
      group: "Групповое",
    };
    return labels[type] || type;
  };

  const participationBadgeClass =
    quest.participation_type === "personal"
      ? "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
      : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";

  const progressData = userProgress || quest.progress_data;
  const currentCount = progressData?.current_count || 0;
  const targetCount = quest.target_count;
  const progressPercentage = progressData?.progress_percentage || 0;
  const isCompleted = quest.is_completed || currentCount >= targetCount;

  return (
    <div
      className={`px-4 py-4 rounded-md w-full max-w-[400px] h-auto flex flex-col gap-3 dark:border-gray-800 border shadow-lg ${className}`}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg text-[#181A2A] dark:text-white flex-1">
          {quest.title}
        </h3>
        {isCompleted && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              Завершено
            </span>
            <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {quest.description}
      </p>

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          {getQuestTypeLabel(quest.quest_type)}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${participationBadgeClass}`}>
          {getParticipationTypeLabel(quest.participation_type)}
        </span>
      </div>

      {quest.reading_group_slug && quest.reading_group_name && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Группа:{" "}
          <Link
            to={`/groups/${quest.reading_group_slug}`}
            className="text-[#4B6BFB] hover:underline"
          >
            {quest.reading_group_name}
          </Link>
        </div>
      )}

      {quest.participation_type === "group" && progressData && (
        <div className="flex gap-2 flex-wrap">

          {progressData.participated
            ? (

              <p className="text-sm px-3 py-2 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {isCompleted ? "Вы участвовали в квесте" : "Вы участвуете в квесте"}
                {progressData.reward_received ? " и получили награду" : ""}
              </p>

            ) : (
              <p className="text-sm px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                {isCompleted ? "Вы не участвовали в квесте" : "Вы еще не участвуете в квесте"}
              </p>
            )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Прогресс: {currentCount} / {targetCount}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <ProgressBar percentage={progressPercentage} />
      </div>

      {quest.reward_template && (
        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-600/20 rounded-md">
          <img
            src={resolveMediaUrl(quest.reward_template.image)}
            alt={quest.reward_template.name}
            className="w-20 h-20 object-cover rounded"
          />
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Награда:</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {quest.reward_template.name}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
        <span>С {formatDate(quest.start_date)}</span>
        <span>До {formatDate(quest.end_date)}</span>
      </div>
    </div>
  );
};

export default QuestCard;
