import { getUserInfo, getUserRewards, getUserStats, getUserToReadingGroupStates, getUserBooks } from "@/services/apiBook";
import BookContainer from "@/ui_components/BookContainer";
import Hero from "@/ui_components/Hero";
import Spinner from "@/ui_components/Spinner";
import Modal from "@/ui_components/Modal";
import RewardCard from "@/ui_components/RewardCard";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import SignupPage from "./SignupPage";
import { useState } from "react";

const ProfilePage = ({ authUsername }) => {
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => {
    setShowModal(curr => !curr)
  }


  const { username } = useParams();

  const { isPending, data } = useQuery({
    queryKey: ["users", username],
    queryFn: () => getUserInfo(username),
  });

  const { data: userRewards } = useQuery({
    queryKey: ["userRewards", username],
    queryFn: () => getUserRewards(username),
    enabled: !!username,
  });

  const { data: userStats } = useQuery({
    queryKey: ["userStats", username],
    queryFn: () => getUserStats(username),
    enabled: !!username,
  });

  const { data: userGroupStates } = useQuery({
    queryKey: ["userGroupStates", data?.id],
    queryFn: () => getUserToReadingGroupStates(data.id),
    enabled: !!data?.id,
  });

  const joinedGroups = (userGroupStates || [])
    .filter((state) => state?.in_reading_group && state?.reading_group)
    .map((state) => state.reading_group);

  const { data: userBooks } = useQuery({
    queryKey: ["userBooks", username],
    queryFn: () => getUserBooks(username),
    enabled: !!username,
  });

  const isOwnProfile = authUsername === username;
  const books = userBooks || [];

  if (isPending) {
    return <Spinner />;
  }

  return (
    <>
      <Hero userInfo={data} authUsername={authUsername} toggleModal={toggleModal} />

      <BookContainer
        books={books}
        title={`Книги ${username}`}
        showVisibilityLabels={isOwnProfile}
      />

      {showModal && (
        <Modal toggleModal={toggleModal}>
          <SignupPage userInfo={data} updateForm={true} toggleModal={toggleModal} />
        </Modal>
      )}

      {/* User Stats Section */}
      {userStats && (
        <div className="max-container padding-y">
          <h2 className="text-2xl font-semibold mb-6 text-[#181A2A] dark:text-white">
            Статистика
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="text-3xl font-bold text-[#4B6BFB]">{userStats.total_quests_completed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Заданий выполнено</div>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="text-3xl font-bold text-green-600">{userStats.total_books_read}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Книг прочитано</div>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="text-3xl font-bold text-purple-600">{userStats.total_comments_created}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Оставленных комментариев</div>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="text-3xl font-bold text-indigo-600">{userStats.total_replies_created ?? 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ответов на комментарии</div>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="text-3xl font-bold text-yellow-600">{userStats.total_rewards_received}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Наград получено</div>
            </div>
          </div>
        </div>
      )}

      {joinedGroups.length > 0 && (
        <div className="max-container padding-y">
          <h2 className="text-2xl font-semibold mb-6 text-[#181A2A] dark:text-white">
            Вступил в группы FIXLATER TODO
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {joinedGroups.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.slug}`}
                className="p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#4B6BFB] transition-colors"
              >
                <div className="text-lg font-semibold text-[#181A2A] dark:text-white">
                  {group.name}
                </div>
                {group.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {group.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* User Rewards Section */}
      {userRewards && userRewards.length > 0 && (
        <div className="max-container padding-y">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#181A2A] dark:text-white">
              Награды
            </h2>
            <Link to={`/rewards?user=${username}`} className="text-[#4B6BFB] hover:underline">
              Посмотреть все
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userRewards.slice(0, 4).map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
