// THIS IS TRYING TO DETAIL THE SHOWING OF GROUPS (.../groups/group-name)

import Badge from "@/ui_components/Badge";
import GroupCreator from "@/ui_components/GroupCreator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { deleteReadingGroup, getReadingGroup, addUserToGroup, removeUserFromGroup, createNotification, getUserToReadingGroupStates} from "@/services/apiBook";
import Spinner from "@/ui_components/Spinner";
import { BASE_URL } from "@/api";
import { HiPencilAlt } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import Modal from "@/ui_components/Modal";
import EditReadingGroupForm from "@/ui_components/EditReadingGroupForm";
import { useState } from "react";
import { toast } from "react-toastify";
import SmallSpinner from "@/ui_components/SmallSpinner";
import SmallSpinnerText from "@/ui_components/SmallSpinnerText";
// import { create } from "domain";


const ReadingGroupPage = ({ username, isAuthenticated }) => {

  const { slug } = useParams();
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  function toggleModal(){
    setShowModal(curr => !curr)
  }

  const {
    isPending,
    isError,
    error,
    data: reading_group,
  } = useQuery({
    queryKey: ["groups", slug],
    queryFn: () => getReadingGroup(slug),
  });

  const reading_groupID = reading_group?.id

  const { data: userStates } = useQuery({
    queryKey: ["userToReadingGroupState", reading_groupID],
    queryFn: () => getUserToReadingGroupStates(reading_groupID),
    enabled: !!reading_groupID, // Only run when ID exists
  });


  const deleteMutation = useMutation({
    mutationFn: (id) => deleteReadingGroup(id),
    onSuccess: () => {
      toast.success("Ваша группа была успешно удалена!")
      navigate("/")
    },

    onError: (err) => {
      console.log(err)
      toast.error(err.message)
    }
  })


  const confirmMutation = useMutation({
    mutationFn: (data) => createNotification(data),
    onSuccess: () => {
      toast.success("Отправлена нотификация.");
      queryClient.invalidateQueries({ queryKey: ["groups", slug] });
      queryClient.invalidateQueries({ queryKey: ["userToReadingGroupState", reading_groupID] });
    },
  });

  const requestMutation = useMutation({
    mutationFn: (id) => addUserToGroup(id),
    onSuccess: () => {

      const formData = new FormData()
      formData.append("directed_to_id", reading_group.creator.id || "")
      formData.append("related_group_id", reading_group.id || "")
      formData.append("category", "GroupJoinRequest")

      confirmMutation.mutate(formData);
      toast.success("Отправлен запрос на добавление в группу.");
      queryClient.invalidateQueries({ queryKey: ["groups", slug] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (id) => removeUserFromGroup(id),
    onSuccess: () => {
      toast.success("Вы успешно покинули группу!");
      queryClient.invalidateQueries({ queryKey: ["groups", slug] });
      queryClient.invalidateQueries({ queryKey: ["userToReadingGroupState", reading_groupID] });
    },
    onError: (err) => {
      toast.error(err.message)
    }
  });


  function onJoinRequest() {
    
      requestMutation.mutate(reading_groupID);
    
  }

  function handleLeaveGroup() {
    leaveMutation.mutate(reading_groupID);
  }

  // Filter users to only show confirmed members (in_reading_group = true)
  const confirmedMembers = reading_group?.user?.filter(member =>
    member.in_reading_group === true
  ) || [];

  // Check if current user is a member of the group
  const isUserMember = userStates?.some(state => state.reading_group.id === reading_groupID && state.in_reading_group && state.user.username === username);
  const isUserPending = userStates?.some(state => state.reading_group.id === reading_groupID && state.in_reading_group === false && state.user.username === username);

  function handleDeleteReadingGroup(){
    const popUp = window.confirm("Вы уверены, что хотите удалить эту группу?")
    if(!popUp){
      return;
    }

    deleteMutation.mutate(reading_groupID)



  }



  if (isPending) {
    return <Spinner />;
  }

  if (isError) {
    return (
      <div className="padding-dx max-container py-9">
        <div className="text-red-600 dark:text-red-400 text-center">
          <h2 className="text-2xl font-bold mb-2">Ошибка загрузки</h2>
          <p className="mb-4">{error?.message || "Не удалось загрузить группу"}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#4B6BFB] text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <>

      <div className="padding-dx max-container py-9 gap-6 flex flex-col">
        <div className="flex justify-between items-center gap-4">
          <span className="flex items-center gap-6">
            <div className="w-[60px] h-[60px] rounded-full overflow-hidden">
              <img
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatar-placeholder.png";
                }}
                className="rounded-full w-full h-full object-cover"
                src={`${BASE_URL}${reading_group.featured_image}`}
                alt={`${reading_group.name} group image`}
              />
            </div>
            <h1 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
              {reading_group.name}
            </h1>
          </span>
          <span className="flex items-center gap-2">
            {isUserMember ? (
              <button onClick={handleLeaveGroup}
                disabled={leaveMutation.isPending}
                className="bg-red-600 text-white py-3 px-8 rounded-md flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  {leaveMutation.isPending ? (
                    <>
                      {" "}
                      <SmallSpinner /> <SmallSpinnerText text="..." />{" "}
                    </>
                    ) : (
                      <SmallSpinnerText text="Выйти" />
                  )}
                </button>
            ) : isUserPending ? (
              <button
                disabled={true}
                className="bg-[#939393] text-white py-3 px-8 rounded-md flex items-right justify-center gap-2 transition-colors"
                >
                  <p>Запрос на вступление отправлен</p>
                </button>
            ) : (
              <button onClick={onJoinRequest}
                disabled={requestMutation.isPending}
                className="bg-[#4B6BFB] text-white py-3 px-8 rounded-md flex items-right justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  {requestMutation.isPending ? (
                    <>
                      {" "}
                      <SmallSpinner /> <SmallSpinnerText text="..." />{" "}
                    </>
                    ) : (
                      <SmallSpinnerText text="Присоединиться" />
                  )}
                </button>
            )}
          </span>
          {isAuthenticated && username === reading_group.creator.username && (
            <span className="flex justify-between items-center gap-2">
              <HiPencilAlt onClick={toggleModal} className="dark:text-white text-3xl cursor-pointer" />

              <MdDelete onClick={handleDeleteReadingGroup} className="dark:text-white text-3xl cursor-pointer" />
            </span>
          )}
        </div>

        <GroupCreator reading_group={reading_group} />
        
        <p className="text-[18px] leading-[2rem] text-justify text-[#3B3C4A] dark:text-[#BABABF]">
          {reading_group.description || "This group doesn't have a description."}
        </p>

        <div className="mt-8">
          <h2 className="text-xl md:text-2xl font-semibold text-[#181A2A] dark:text-[#FFFFFF] mb-4">
            Group Members ({confirmedMembers.length})
          </h2>
          {confirmedMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {confirmedMembers.map((member) => (
                <div key={member.id} className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
                    <img
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/avatar-placeholder.png";
                      }}
                      src={member.profile_picture ? `${BASE_URL}${member.profile_picture}` : "/avatar-placeholder.png"}
                      alt={`${member.username} profile picture`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-[#181A2A] dark:text-[#FFFFFF] text-center">
                    {member.first_name && member.last_name
                      ? `${member.first_name} ${member.last_name}`
                      : member.username}
                  </h3>
                  <p className="text-sm text-[#3B3C4A] dark:text-[#BABABF] text-center">
                    @{member.username}
                  </p>
                  {member.email && (
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] text-center mt-1">
                      {member.email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#3B3C4A] dark:text-[#BABABF]">
              В этой группе пока нет участников.
            </p>
          )}
        </div>
      </div>

     {showModal && <Modal toggleModal={toggleModal}> 
        <EditReadingGroupForm reading_group={reading_group} onClose={toggleModal} />
      </Modal>}
    </>
  );
};

export default ReadingGroupPage;
