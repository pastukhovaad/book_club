import { FaInstagram } from 'react-icons/fa'
import { FaFacebookF } from 'react-icons/fa'
import { BsTwitterX } from 'react-icons/bs'
import { FaYoutube } from 'react-icons/fa'
import { HiPencilAlt } from 'react-icons/hi'
import { resolveMediaUrl } from '@/api'

const Hero = ({ userInfo, authUsername, toggleModal }) => {
  return (
    <div className="padding-x py-9 max-container flex flex-col items-center justify-center gap-4 bg-[#F6F6F7] dark:bg-[#242535] rounded-md">
      <div className="flex gap-4">

        <div className="flex items-center gap-2">

          {/* User Avatar */}
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
          <p className="text-[18px] text-[#181A2A] dark:text-white">
            {userInfo?.first_name} {userInfo?.last_name}
          </p>
          <p className="text-[16px] text-[#696A75] font-thin dark:text-[#BABABF]">
            {userInfo?.username || 'Error showing username'}
          </p>
          <p className="text-[16px] text-[#696A75] font-thin dark:text-[#BABABF]">
            {userInfo?.job_title}
          </p>
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

      <p className="text-[#3B3C4A] text-[16px] max-md:leading-[2rem] lg:leading-normal lg:mx-[200px] text-center dark:text-[#BABABF]">
        {userInfo?.bio || 'Этот пользователь не добавил информацию о себе.'}
      </p>

      {/* <div className="flex gap-4 justify-center items-center text-white text-xl">
        <div className="w-[40px] h-[40px] rounded-lg bg-[#696A75] flex justify-center items-center">
          <FaInstagram />
        </div>
        <div className="w-[40px] h-[40px] rounded-lg bg-[#696A75] flex justify-center items-center">
          <FaFacebookF />
        </div>
        <div className="w-[40px] h-[40px] rounded-lg bg-[#696A75] flex justify-center items-center">
          <BsTwitterX />
        </div>
        <div className="w-[40px] h-[40px] rounded-lg bg-[#696A75] flex justify-center items-center">
          <FaYoutube />
        </div>
      </div> */}
    </div>
  )
}

export default Hero
