import { getUserInfo, getUserRewards, getUserStats, getUserBooks } from "@/services";
import BookContainer from "@/ui_components/BookContainer";
import Hero from "@/ui_components/Hero";
import Spinner from "@/ui_components/Spinner";
import Modal from "@/ui_components/Modal";
import RewardCard from "@/ui_components/RewardCard";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import SignupPage from "./SignupPage";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const ProfilePage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { username: authUsername } = useAuth();

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

  const joinedGroups = data?.reading_groups || [];

  const { data: userBooks } = useQuery({
    queryKey: ["userBooks", username],
    queryFn: () => getUserBooks(username),
    enabled: !!username,
  });

  const isOwnProfile = authUsername === username;
  const books = userBooks || [];

  const noneText = books.length === 0 ? isOwnProfile ? "Вы ещё не выкладывали книг."
    : "Пользователь ещё не выкладывал книг." : "";

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
        noneText={noneText}
      />

      {showModal && (
        <Modal toggleModal={toggleModal}>
          <SignupPage userInfo={data} updateForm={true} toggleModal={toggleModal} />
        </Modal>
      )}

      {userStats ? (
        <div className="max-container padding-y">
          <h2 className="text-2xl font-semibold mb-6 text-[#181A2A] dark:text-white">
            Статистика
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
            <div className="p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="text-l font-bold text-blue-800">
                {userStats.favorite_genre || "–"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Любимый жанр</div>
            </div>
          </div>
        </div>
      ) : (
        <p className="flex justify-center text-[#3B3C4A] dark:text-[#BABABF]">
          Ошибка при загрузке статистики пользователя.
        </p>
      )}

      <div className="max-container padding-y">
        <h2 className="text-2xl font-semibold mb-6 text-[#181A2A] dark:text-white">
          Вступил в группы
        </h2>
      {joinedGroups.length > 0 ? (
        <div>
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
      ) : username === authUsername ? (
        <p className="flex justify-center text-[#3B3C4A] dark:text-[#BABABF]">
          Вы ещё не вступали в группы.
        </p>
      ) : (
        <p className="flex justify-center text-[#3B3C4A] dark:text-[#BABABF]">
          Пользователь ещё не вступал в группы.
        </p>
      )}
      </div>

      <div className="max-container padding-y">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#181A2A] dark:text-white">
              Награды
            </h2>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/profile/${username}/board`)}
                className="bg-[#4B6BFB] text-white py-2 px-4 rounded-md hover:bg-[#3a5ae0] transition-colors"
              >
                Открыть доску наград пользователя
              </button>
              <Link to={`/rewards?user=${username}`} className="text-[#4B6BFB] hover:underline">
                Посмотреть все награды
              </Link>
            </div>
          </div>
          {userRewards && userRewards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userRewards.slice(0, 4).map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
          ) : username === authUsername ? (
            <p className="flex justify-center text-[#3B3C4A] dark:text-[#BABABF]">
              Вы ещё не получали наград.
            </p>
          ) : (
            <p className="flex justify-center text-[#3B3C4A] dark:text-[#BABABF]">
              Пользователь ещё не получал наград.
            </p>
          )}
        </div>
      </div>


    </>
  );
};

export default ProfilePage;
