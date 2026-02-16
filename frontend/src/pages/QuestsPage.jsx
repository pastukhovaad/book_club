import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateDailyPersonalQuests,
  getMyQuests,
  getUserReadingGroups,
  getQuestTemplates,
  createQuestTemplate,
  updateQuestTemplate,
  deleteQuestTemplate,
  getRewardTemplates,
  createRewardTemplate,
  deleteRewardTemplate,
} from "@/services";
import { resolveMediaUrl } from "@/api";
import QuestCard from "@/ui_components/QuestCard";
import Spinner from "@/ui_components/Spinner";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const QUEST_TYPE_OPTIONS = [
  { value: "read_books", label: "Прочитать книги" },
  { value: "create_comments", label: "Оставить комментарии" },
  { value: "reply_comments", label: "Ответить на комментарии" },
  { value: "place_rewards", label: "Разместить призы" },
];

const QUEST_SCOPE_OPTIONS = [
  { value: "personal", label: "Личное" },
  { value: "group", label: "Групповое" },
];

const QuestsPage = () => {
  const { isSuperuser } = useAuth();
  const [filter, setFilter] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [questForm, setQuestForm] = useState({
    title: "", description: "", quest_type: "read_books", quest_scope: "personal", target_count: 1, is_active: true,
  });
  const [rewardForm, setRewardForm] = useState({ name: "", image: null });
  const queryClient = useQueryClient();

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["myQuests"],
    queryFn: getMyQuests,
  });

  const { data: userGroups } = useQuery({
    queryKey: ["userReadingGroups"],
    queryFn: getUserReadingGroups,
  });

  const { data: questTemplates, isPending: questTemplatesLoading } = useQuery({
    queryKey: ["questTemplates"],
    queryFn: getQuestTemplates,
    enabled: filter === 'manage',
  });

  const { data: rewardTemplates, isPending: rewardTemplatesLoading } = useQuery({
    queryKey: ["rewardTemplates"],
    queryFn: getRewardTemplates,
    enabled: filter === 'manage',
  });

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

  const createQuestTemplateMutation = useMutation({
    mutationFn: createQuestTemplate,
    onSuccess: () => {
      toast.success("Шаблон задания создан");
      queryClient.invalidateQueries({ queryKey: ["questTemplates"] });
      setQuestForm({ title: "", description: "", quest_type: "read_books", quest_scope: "personal", target_count: 1, is_active: true });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateQuestTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => updateQuestTemplate(id, data),
    onSuccess: () => {
      toast.success("Шаблон задания обновлён");
      queryClient.invalidateQueries({ queryKey: ["questTemplates"] });
      setEditingTemplate(null);
      setQuestForm({ title: "", description: "", quest_type: "read_books", quest_scope: "personal", target_count: 1, is_active: true });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteQuestTemplateMutation = useMutation({
    mutationFn: deleteQuestTemplate,
    onSuccess: () => {
      toast.success("Шаблон задания удалён");
      queryClient.invalidateQueries({ queryKey: ["questTemplates"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const createRewardTemplateMutation = useMutation({
    mutationFn: (formData) => createRewardTemplate(formData),
    onSuccess: () => {
      toast.success("Шаблон приза создан");
      queryClient.invalidateQueries({ queryKey: ["rewardTemplates"] });
      setRewardForm({ name: "", image: null });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRewardTemplateMutation = useMutation({
    mutationFn: deleteRewardTemplate,
    onSuccess: () => {
      toast.success("Шаблон приза удалён");
      queryClient.invalidateQueries({ queryKey: ["rewardTemplates"] });
    },
    onError: (err) => toast.error(err.message),
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

  const tabClass = (tabName) =>
    `px-4 py-2 rounded-md transition-colors ${
      filter === tabName
        ? 'bg-[#4B6BFB] text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`;

  return (
    <div className="padding-y max-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
          Мои задания
        </h2>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <button onClick={() => setFilter('all')} className={tabClass('all')}>
          Все ({quests.length})
        </button>
        <button onClick={() => setFilter('personal')} className={tabClass('personal')}>
          Личные ({personalQuests.length})
        </button>
        <button onClick={() => setFilter('group')} className={tabClass('group')}>
          Групповые ({groupQuests.length})
        </button>
        {isSuperuser && (
          <button onClick={() => setFilter('manage')} className={tabClass('manage')}>
            Управление заданиями
          </button>
        )}
      </div>

      {filter === 'group' && (
        <div className="mb-6">
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

      {filter === 'manage' && isSuperuser && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-[#181A2A] dark:text-white">
              Шаблоны заданий
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingTemplate) {
                  updateQuestTemplateMutation.mutate({ id: editingTemplate.id, data: questForm });
                } else {
                  createQuestTemplateMutation.mutate(questForm);
                }
              }}
              className="p-4 border rounded-md dark:border-gray-700 mb-6 space-y-4"
            >
              <h4 className="font-medium text-gray-700 dark:text-gray-300">
                {editingTemplate ? "Редактировать шаблон" : "Создать шаблон"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Название"
                  value={questForm.title}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, title: e.target.value }))}
                  className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  required
                />
                <select
                  value={questForm.quest_type}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, quest_type: e.target.value }))}
                  className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                >
                  {QUEST_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={questForm.quest_scope}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, quest_scope: e.target.value }))}
                  className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                >
                  {QUEST_SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Целевое количество"
                  value={questForm.target_count}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, target_count: parseInt(e.target.value) || 1 }))}
                  min="1"
                  className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  required
                />
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={questForm.is_active}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  Активен
                </label>
              </div>
              <textarea
                placeholder="Описание"
                value={questForm.description}
                onChange={(e) => setQuestForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createQuestTemplateMutation.isPending || updateQuestTemplateMutation.isPending}
                  className="bg-[#4B6BFB] text-white py-2 px-6 rounded-md hover:bg-[#3a5ae0] transition-colors disabled:opacity-50"
                >
                  {editingTemplate ? "Сохранить" : "Создать"}
                </button>
                {editingTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setQuestForm({ title: "", description: "", quest_type: "read_books", quest_scope: "personal", target_count: 1, is_active: true });
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>

            {questTemplatesLoading ? (
              <Spinner />
            ) : (
              <div className="space-y-3">
                {(questTemplates || []).map((template) => (
                  <div
                    key={template.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md dark:border-gray-700 gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#181A2A] dark:text-white">{template.title}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {template.quest_type_display}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          {template.quest_scope_display}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">x{template.target_count}</span>
                        {!template.is_active && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            Неактивен
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setQuestForm({
                            title: template.title,
                            description: template.description || "",
                            quest_type: template.quest_type,
                            quest_scope: template.quest_scope,
                            target_count: template.target_count,
                            is_active: template.is_active,
                          });
                        }}
                        className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Удалить шаблон задания?")) {
                            deleteQuestTemplateMutation.mutate(template.id);
                          }
                        }}
                        className="px-3 py-1 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
                {(questTemplates || []).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Нет шаблонов заданий
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 text-[#181A2A] dark:text-white">
              Шаблоны призов
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData();
                formData.append("name", rewardForm.name);
                if (rewardForm.image) {
                  formData.append("image", rewardForm.image);
                }
                createRewardTemplateMutation.mutate(formData);
              }}
              className="p-4 border rounded-md dark:border-gray-700 mb-6 space-y-4"
            >
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Добавить шаблон приза</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Название приза"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  required
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setRewardForm(prev => ({ ...prev, image: e.target.files[0] || null }))}
                  className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createRewardTemplateMutation.isPending}
                className="bg-[#4B6BFB] text-white py-2 px-6 rounded-md hover:bg-[#3a5ae0] transition-colors disabled:opacity-50"
              >
                {createRewardTemplateMutation.isPending ? "Загрузка..." : "Загрузить"}
              </button>
            </form>

            {rewardTemplatesLoading ? (
              <Spinner />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(rewardTemplates || []).map((reward) => (
                  <div
                    key={reward.id}
                    className="p-3 border rounded-md dark:border-gray-700 flex flex-col items-center gap-2"
                  >
                    <img
                      src={resolveMediaUrl(reward.image)}
                      alt={reward.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <span className="text-sm text-center text-gray-700 dark:text-gray-300">{reward.name}</span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Удалить приз "${reward.name}"?`)) {
                          deleteRewardTemplateMutation.mutate(reward.id);
                        }
                      }}
                      className="px-3 py-1 text-xs border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
                {(rewardTemplates || []).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4 col-span-full">
                    Нет шаблонов призов
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {filter !== 'manage' && (
        <>
          {filteredQuests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {filter === 'personal' && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" >У вас ещё нет личных ежедневных заданий.</p>
                  <button
                    onClick={() => generatePersonalQuestsMutation.mutate()}
                    disabled={generatePersonalQuestsMutation.isPending}
                    className="bg-[#4B6BFB] text-white py-3 px-8 rounded-md hover:bg-[#3a5ae0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatePersonalQuestsMutation.isPending ? "Создание..." : "Открыть личные ежедневные задания"}
                  </button>
                </div>
              )}
              {filter === 'group' && 'У вас ещё нет групповых заданий.'}
              {filter === 'all' && 'У вас ещё нет заданий. Перейдите в раздел "Личные", чтобы открыть их.'}
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
        </>
      )}
    </div>
  );
};

export default QuestsPage;
