import { HiPencilAlt } from 'react-icons/hi'
import { resolveMediaUrl } from '@/api'

const Hero = ({ userInfo, authUsername, toggleModal }) => {
  return (
    <div className="padding-x py-9 max-container flex flex-col items-center justify-center gap-4 bg-[#F6F6F7] dark:bg-[#242535] rounded-md">
      <div className="flex gap-4">

        <div className="flex items-center gap-2">

          {userInfo.profile_picture ? (
            <img
              src={resolveMediaUrl(userInfo.profile_picture)}
              className="w-[90px] h-[90px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[90px] h-[90px] rounded-full object-cover bg-blue-600 flex items-center justify-center text-white font-semibold text-4xl">
              {userInfo.username[0].toUpperCase()}
            </div>
          )}
        </div>


        <span>
          {userInfo?.first_name || userInfo?.last_name ? (
            <div>
             <p className="text-[18px] text-[#181A2A] dark:text-white">
             {userInfo?.first_name} {userInfo?.last_name || ""}
             </p>
             <p className="text-[16px] text-[#696A75] font-thin dark:text-[#BABABF]">
             @{userInfo?.username || 'Error showing username'}
             </p>
            </div>
          ) : (
          <p className="text-[18px] text-[#181A2A] dark:text-white">
            @{userInfo?.username || 'Ошибка отображения имени пользователя'}
          </p>
          )}
        </span>

        {userInfo?.username === authUsername && (
          <span>
            <HiPencilAlt
              className="dark:text-white text-2xl cursor-pointer"
              onClick={toggleModal}
            />
          </span>
        )}
      </div>

      {userInfo?.username === authUsername ? (
        <p className="text-[#3B3C4A] text-[16px] max-md:leading-[2rem] lg:leading-normal lg:mx-[200px] text-center dark:text-[#BABABF]">
        {userInfo?.bio || 'Вы не добавили информацию о себе.'}
        </p>
      ) : (
        <p className="text-[#3B3C4A] text-[16px] max-md:leading-[2rem] lg:leading-normal lg:mx-[200px] text-center dark:text-[#BABABF]">
          {userInfo?.bio || 'Этот пользователь не добавил информацию о себе.'}
        </p>
      )}
    </div>
  )
}

export default Hero
