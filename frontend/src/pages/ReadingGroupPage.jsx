// THIS IS TRYING TO DETAIL THE SHOWING OF GROUPS (.../groups/group-name)

import Badge from "@/ui_components/Badge";
import GroupCreator from "@/ui_components/GroupCreator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { deleteReadingGroup, getReadingGroup, addUserToGroup, removeUserFromGroup} from "@/services/apiBook";
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

  console.log(reading_group);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteReadingGroup(id),
    onSuccess: () => {
      toast.success("Your group has been deleted successfully! I think?")  // REM
      navigate("/")
    },

    onError: (err) => {
      console.log(err)
      toast.error(err.message)
    }
  })


  const mutation = useMutation({
    mutationFn: (id) => addUserToGroup(id),
    onSuccess: () => {
      toast.success("You have successfully joined the group!");
      queryClient.invalidateQueries({ queryKey: ["groups", slug] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (id) => removeUserFromGroup(id),
    onSuccess: () => {
      toast.success("You have successfully left the group!");
      queryClient.invalidateQueries({ queryKey: ["groups", slug] });
    },
    onError: (err) => {
      toast.error(err.message)
    }
  });


  function onSubmit() {
    
      mutation.mutate(reading_groupID);
    
  }

  function handleLeaveGroup() {
    leaveMutation.mutate(reading_groupID);
  }

  // Check if current user is a member of the group
  const isUserMember = reading_group?.user?.some(member => member.username === username);


  function handleDeleteReadingGroup(){
    const popUp = window.confirm("Are you sure you want to delete this group? Haha group not post")  // REM
    if(!popUp){
      return;
    }

    deleteMutation.mutate(reading_groupID)



  }

  

  if (isPending) {
    return <Spinner />;
  }

  return (
    <>

      <div className="padding-dx max-container py-9 gap-6 flex flex-col">
        <div className="flex justify-between items-center gap-4">
          <span className="flex items-center gap-6">
            <div className="w-[60px] h-[60px] rounded-full overflow-hidden">
              <img
                className="c rounded-full w-full h-full object-cover"
                src={`${BASE_URL}${reading_group.featured_image}`}
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
                      <SmallSpinner /> <SmallSpinnerText text="Leaving..." />{" "}
                    </>
                    ) : (
                      <SmallSpinnerText text="Leave group" />
                  )}
                </button>
            ) : (
              <button onClick={onSubmit}
                disabled={mutation.isPending}
                className="bg-[#4B6BFB] text-white py-3 px-8 rounded-md flex items-right justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  {mutation.isPending ? (
                    <>
                      {" "}
                      <SmallSpinner /> <SmallSpinnerText text="Joining group..." />{" "}
                    </>
                    ) : (
                      <SmallSpinnerText text="Join group" />
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
            Group Members ({reading_group.user?.length || 0})
          </h2>
          {reading_group.user && reading_group.user.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reading_group.user.map((member) => (
                <div key={member.id} className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
                    <img
                      src={member.profile_picture ? `${BASE_URL}${member.profile_picture}` : "/avatar-placeholder.png"}
                      alt={member.username}
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
              No members in this group yet.
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
