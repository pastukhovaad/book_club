import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupQuests, generateDailyQuests, getReadingGroup, getUserToReadingGroupStates } from "@/services/apiBook";
import QuestCard from "@/ui_components/QuestCard";
import Spinner from "@/ui_components/Spinner";
import { toast } from "react-toastify";

const GroupQuestsPage = ({ username }) => {
  const { slug } = useParams();
  const queryClient = useQueryClient();

  // Fetch reading group to get creator info
  const { data: reading_group } = useQuery({
    queryKey: ["groups", slug],
    queryFn: () => getReadingGroup(slug),
  });

  const reading_groupID = reading_group?.id;

  // Fetch user states to check membership
  const { data: userStates } = useQuery({
    queryKey: ["userToReadingGroupState", reading_groupID],
    queryFn: () => getUserToReadingGroupStates(reading_groupID),
    enabled: !!reading_groupID,
  });

  // Check if current user is a member or creator
  const isUserMember = userStates?.some(
    (state) =>
      state.reading_group.id === reading_groupID &&
      state.in_reading_group &&
      state.user.username === username
  );
  const isCreator = username === reading_group?.creator?.username;
  const isGroupMember = isUserMember || isCreator;

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["groupQuests", slug],
    queryFn: () => getGroupQuests(slug),
    enabled: !!reading_groupID && isGroupMember,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateDailyQuests(slug),
    onSuccess: (data) => {
      toast.success(data.message || "Ежедневные задания созданы!");
      queryClient.invalidateQueries(["groupQuests", slug]);
    },
    onError: (err) => {
      toast.error(err.message || "Не удалось создать задания");
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

  return (
    <div className="padding-y max-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <Link
            to={`/groups/${slug}`}
            className="text-[#4B6BFB] hover:underline mb-2 inline-block"
          >
            ← Вернуться к группе
          </Link>
          <h2 className="leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
            Задания группы
          </h2>
        </div>
      </div>

      {/* Generate button or quests */}
      {quests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
            Ежедневные задания ещё не созданы
          </p>
          {isGroupMember && (
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-[#4B6BFB] text-white py-3 px-8 rounded-md hover:bg-[#3a5ae0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateMutation.isPending ? "Создание..." : "Открыть ежедневные задания"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((item) => (
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

export default GroupQuestsPage;
