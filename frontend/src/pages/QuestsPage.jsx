import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateDailyPersonalQuests, getMyQuests, getUserReadingGroups } from "@/services/apiBook";
import QuestCard from "@/ui_components/QuestCard";
import Spinner from "@/ui_components/Spinner";
import { toast } from "react-toastify";

const QuestsPage = () => {
  const [filter, setFilter] = useState('all'); // 'personal', 'all', 'group'
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const queryClient = useQueryClient();

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["myQuests"],
    queryFn: getMyQuests,
  });

  console.log("Loaded quests:", data);

  const { data: userGroups } = useQuery({
    queryKey: ["userReadingGroups"],
    queryFn: getUserReadingGroups,
  });

  console.log("User's reading groups:", userGroups);

  const generatePersonalQuestsMutation = useMutation({
    mutationFn: generateDailyPersonalQuests,
    onSuccess: (data) => {
      toast.success(data.message || "Ежедневные личные задания созданы!");
      queryClient.invalidateQueries(["myQuests"]);
    },
    onError: (err) => {
      toast.error(err.message || "Не удалось создать личные задания");
    },
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

  const personalQuests = quests.filter(
    (item) => item.quest?.participation_type === 'personal'
  );
  const groupQuests = quests.filter(
    (item) => item.quest?.participation_type === 'group'
  );

  const filteredQuests = quests.filter((item) => {
    if (filter === 'personal') {
      return item.quest?.participation_type === 'personal';
    }
    if (filter === 'group') {
      if (item.quest?.participation_type !== 'group') return false;
      if (selectedGroupId === 'all') return true;
      return String(item.quest?.reading_group) === String(selectedGroupId);
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
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('personal')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'personal'
              ? 'bg-[#4B6BFB] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Личные ({personalQuests.length})
        </button>
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
          onClick={() => setFilter('group')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'group'
              ? 'bg-[#4B6BFB] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Групповые ({groupQuests.length})
        </button>
      </div>

      {filter === 'group' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Группа
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option value="all">Все группы</option>
            {(userGroups || []).map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quests grid */}
      {filteredQuests.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {filter === 'personal' && (
            <div className="flex flex-col items-center gap-4">
              <p>У вас пока нет личных ежедневных заданий</p>
              <button
                onClick={() => generatePersonalQuestsMutation.mutate()}
                disabled={generatePersonalQuestsMutation.isPending}
                className="bg-[#4B6BFB] text-white py-3 px-8 rounded-md hover:bg-[#3a5ae0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatePersonalQuestsMutation.isPending ? "Создание..." : "Открыть личные ежедневные задания"}
              </button>
            </div>
          )}
          {filter === 'group' && 'У вас пока нет групповых заданий'}
          {filter === 'all' && 'У вас пока нет заданий'}
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
