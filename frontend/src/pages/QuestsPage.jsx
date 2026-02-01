import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyQuests } from "@/services/apiBook";
import QuestCard from "@/ui_components/QuestCard";
import Spinner from "@/ui_components/Spinner";

const QuestsPage = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["myQuests"],
    queryFn: getMyQuests,
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
          Ошибка загрузки заданий: {error.message}
        </div>
      </div>
    );
  }

  const quests = data || [];

  const filteredQuests = quests.filter(item => {
    if (filter === 'completed') {
      return item.progress?.current_count >= item.quest.target_count;
    }
    if (filter === 'active') {
      return item.progress?.current_count < item.quest.target_count;
    }
    return true;
  });

  return (
    <div className="padding-y max-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
          Мои задания
        </h2>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-[#4B6BFB] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Все ({quests.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'active'
              ? 'bg-[#4B6BFB] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Активные ({quests.filter(q => q.progress?.current_count < q.quest.target_count).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'completed'
              ? 'bg-[#4B6BFB] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Завершенные ({quests.filter(q => q.progress?.current_count >= q.quest.target_count).length})
        </button>
      </div>

      {/* Quests grid */}
      {filteredQuests.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {filter === 'all' ? 'У вас пока нет заданий' : `Нет ${filter === 'active' ? 'активных' : 'завершенных'} заданий`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuests.map((item) => (
            <QuestCard
              key={item.quest.id}
              quest={item.quest}
              userProgress={item.progress}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestsPage;
