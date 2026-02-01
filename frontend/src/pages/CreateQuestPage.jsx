import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createQuest, getReadingGroups, getRewardTemplates } from "@/services/apiBook";
import Spinner from "@/ui_components/Spinner";

const CreateQuestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quest_type: "read_books",
    participation_type: "personal",
    target_count: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    reading_group: "",
    reward_template: "",
  });

  const [error, setError] = useState("");

  // Fetch reading groups
  const { data: groupsData } = useQuery({
    queryKey: ["readingGroups"],
    queryFn: () => getReadingGroups(1, 100),
  });

  // Fetch reward templates
  const { data: rewardsData } = useQuery({
    queryKey: ["rewardTemplates"],
    queryFn: getRewardTemplates,
  });

  const createQuestMutation = useMutation({
    mutationFn: createQuest,
    onSuccess: () => {
      navigate("/quests");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-adjust participation type based on group selection
    if (name === "reading_group") {
      if (value && formData.participation_type === "global") {
        setFormData(prev => ({ ...prev, participation_type: "group" }));
      } else if (!value && formData.participation_type === "group") {
        setFormData(prev => ({ ...prev, participation_type: "personal" }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title.trim()) {
      setError("Введите название задания");
      return;
    }
    if (!formData.end_date) {
      setError("Выберите дату окончания");
      return;
    }
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError("Дата окончания должна быть позже даты начала");
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      target_count: parseInt(formData.target_count),
      reading_group: formData.reading_group || null,
      reward_template: formData.reward_template || null,
    };

    createQuestMutation.mutate(submitData);
  };

  const groups = groupsData?.results || [];
  const rewards = rewardsData || [];

  return (
    <div className="padding-y max-container">
      <div className="max-w-2xl mx-auto">
        <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
          Создать задание
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 rounded-md text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Название *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Описание
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          {/* Quest Type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Тип задания *
            </label>
            <select
              name="quest_type"
              value={formData.quest_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
              required
            >
              <option value="read_books">Прочитать книги</option>
              <option value="create_comments">Оставить комментарии</option>
              <option value="reply_comments">Ответить на комментарии</option>
              <option value="place_rewards">Разместить призы</option>
            </select>
          </div>

          {/* Target Count */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Целевое количество *
            </label>
            <input
              type="number"
              name="target_count"
              value={formData.target_count}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
              required
            />
          </div>

          {/* Participation Type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Тип участия *
            </label>
            <select
              name="participation_type"
              value={formData.participation_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
              required
            >
              <option value="personal">Личное</option>
              <option value="group">Групповое</option>
              <option value="global">Глобальное</option>
            </select>
          </div>

          {/* Reading Group */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Читательская группа (опционально)
            </label>
            <select
              name="reading_group"
              value={formData.reading_group}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="">Без группы</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Дата начала *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Дата окончания *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                required
              />
            </div>
          </div>

          {/* Reward Template */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Награда (опционально)
            </label>
            <select
              name="reward_template"
              value={formData.reward_template}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="">Без награды</option>
              {rewards.map(reward => (
                <option key={reward.id} value={reward.id}>
                  {reward.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={createQuestMutation.isPending}
              className="flex-1 bg-[#4B6BFB] text-white py-3 px-6 rounded-md hover:bg-[#3a5ae0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createQuestMutation.isPending ? <Spinner /> : "Создать задание"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/quests")}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestPage;
