
import { resolveMediaUrl } from "@/api"
import { FormatDate } from "@/services/formatDate"
import { Link } from "react-router-dom"

const GroupCreator = ({reading_group}) => {
  return (
    <Link to={`/profile/${reading_group.creator.username}`}>
    <div className="flex items-center gap=4 ">

      <span className="flex items-center gap-2">

          <div className="w-[40px] h-[40px] rounded-full overflow-hidden">
            {/* User Avatar */}
            {reading_group.creator.profile_picture ? (
              <img
                src={resolveMediaUrl(reading_group.creator.profile_picture)}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {reading_group.creator.username[0].toUpperCase()}
              </div>
            )}
          </div>

        <small className="text-[#696A75] text-[14px]">
          {reading_group.creator.first_name} {reading_group.creator.last_name}
        </small>
      </span>

      <small className="text-[#696A75] text-[14px] ml-3">
        {FormatDate(reading_group.created_at)}
      </small>


    </div>
    </Link>
  )
}

export default GroupCreator
