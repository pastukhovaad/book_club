import { Link } from "react-router-dom";
import { FormatDate } from "@/services/formatDate";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteNotification, getUserToReadingGroupStates, getNotification, confirmUserToGroup, createNotification } from '@/services/apiBook'
import { useState } from "react";
import { set } from "react-hook-form";
import { decl } from "postcss";


const NotificationCard = ({ notification }) => {

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const queryClient = useQueryClient();

  const notificationID = notification?.id

  const deleteMutation = useMutation({
      mutationFn: (id) => deleteNotification(id),
      onSuccess: () => {
        setIsDeleted(true);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
      onError: (error) => {
        console.error("Error deleting notification:", error);
      }
  })

  const declineUserMutation = useMutation({
    mutationFn: () => deleteMutation.mutate(notificationID),
    onSuccess: () => {
      setIsDeleted(true);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      createNotification({
        directed_to_id: notification.related_to.id,
        category: "GroupRequestDeclined",
        related_group_id: notification.related_group.id,
        related_to: notification.directed_to.id,
      })
    },
    onError: (error) => {
      console.error("Error declining user:", error);
    }
  })

  const confirmUserMutation = useMutation({
      mutationFn: () => confirmUserToGroup(notification.related_group.id, notification.related_to.id),
      onSuccess: () => {
        deleteMutation.mutate(notificationID);
        setIsDeleted(true);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        createNotification({
          directed_to_id: notification.related_to.id,
          category: "GroupRequestAccepted",
          related_group_id: notification.related_group.id,
          related_to: notification.directed_to.id,
        })

      },
      onError: (error) => {
        console.error("Error accepting/confirming user:", error);
      }
  })


  function handleDeleteNotification() {
    deleteMutation.mutate(notificationID);
  }

  function handleGroupAcceptRequest() {
    confirmUserMutation.mutate();
  }

  function handleGroupDeclineRequest() {
    declineUserMutation.mutate();
  }

  const shouldShowOkButton =
    notification.category === "GroupRequestDeclined" ||
    notification.category === "GroupRequestAccepted" ||
    notification.category === null;

  const shouldShowGroupAcceptDeclineButtons =
    notification.category === "GroupJoinRequest";
  
  if (isDeleted) {
    return null;
  }

  return (
    <div className="px-4 py-4 rounded-md w-[900px] h-auto flex flex-col gap-3 dark:border-gray-800 border shadow-lg hover:shadow-md transition-shadow">
      {/* Notification Text */}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[#181A2A] dark:text-gray-200">
          {notification.category === "GroupJoinRequest" ? (
            <>
              Пользователь{" "}
              <Link
                to={`/profile/${notification.related_to.slug}`}
                className="underline hover:text-blue-600 dark:hover:text-blue-400"
              >
                {notification.related_to.username}
              </Link>{" "}
              хочет вступить {" "}
              {notification.related_group ? (
                <Link
                  to={`/groups/${notification.related_group.slug}`}
                  className="underline hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {notification.related_group.name}
                </Link>
              ) : (
                "в одну из ваших неуказанных групп. Пожалуйста, отклоните этот запрос"
              )}{""}.
            </>
          ) : notification.category === "GroupRequestDeclined" ? (
            <>
              Ваш запрос на вступление в группу{" "}
              {notification.related_group ? (
                <Link
                  to={`/groups/${notification.related_group.slug}`}
                  className="underline hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {notification.related_group.name}
                </Link>
              ) : (
                ""
              )}{" "}
              был отклонен.
            </>
          ) : notification.category === "GroupRequestAccepted" ? (
            <>
              Ваш запрос на вступление в группу{" "}
              {notification.related_group ? (
                <Link
                  to={`/groups/${notification.related_group.slug}`}
                  className="underline hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {notification.related_group.name}
                </Link>
              ) : (
                ""
              )}{" "}
              был принят.
            </>
          ) : (
            "Новое уведомление"
          )}
        </p>
        <div className="text-sm text-[#181A2A] dark:text-gray-200">
            {notification.extra_text && notification.category !== "GroupRequestDeclined" && notification.category !== "GroupRequestAccepted" && (
            <p>
              {notification.extra_text}
            </p>
            )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {FormatDate(notification.sent_at)}
      </div>

      {shouldShowOkButton ? (
        <button
          onClick={handleDeleteNotification}
          disabled={isDeleting}
          className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isDeleting ? "..." : "Ок"}
        </button>
      ) : shouldShowGroupAcceptDeclineButtons ? (
        <div className="flex gap-4">
          <button
            onClick={handleGroupAcceptRequest}
            disabled={isDeleting}
            className="flex-1 px-3 py-1 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isDeleting ? "..." : "Принять"}
          </button>
          <button
            onClick={handleGroupDeclineRequest}
            disabled={isDeleting}
            className="flex-1 px-3 py-1 bg-red-600 dark:bg-red-500 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isDeleting ? "..." : "Отклонить"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationCard;
