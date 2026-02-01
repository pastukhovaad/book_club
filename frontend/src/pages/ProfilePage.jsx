import { getUserInfo, getUserRewards, getUserStats } from "@/services/apiBook";
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

  const books = data?.author_posts;

  if (isPending) {
    return <Spinner />;
  }

  return (
    <>
      <Hero userInfo={data} authUsername={authUsername} toggleModal={toggleModal} />

      {/* User Stats Section */}
      {userStats && (
        <div className="max-container padding-y">
          <h2 className="text-2xl font-semibold mb-6 text-[#181A2A] dark:text-white">
            Статистика
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="text-sm text-gray-600 dark:text-gray-400">Комментариев создано</div>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="text-3xl font-bold text-yellow-600">{userStats.total_rewards_received}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Наград получено</div>
            </div>
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
            {authUsername === username && (
              <Link to="/rewards" className="text-[#4B6BFB] hover:underline">
                Посмотреть все
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userRewards.slice(0, 4).map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}

      <BookContainer books={books} title={`Книги ${username}`} />

      {showModal && (
        <Modal toggleModal={toggleModal}>
          <SignupPage userInfo={data} updateForm={true} toggleModal={toggleModal} />
        </Modal>
      )}
    </>
  );
};

export default ProfilePage;
