import { resolveMediaUrl } from "@/api";
import { FormatDate } from "@/services/formatDate";
import { Link } from "react-router-dom";

const CardFooter = ({ book }) => {
  return (
    <Link to={`/profile/${book.author.username}`}>
      <div className="flex items-center gap=4 ">
        <span className="flex items-center gap-2">
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden">
            {/* User Avatar */}
            {book.author.profile_picture ? (
              <img
                src={resolveMediaUrl(book.author.profile_picture)}
                alt={book.author.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {book.author.username[0].toUpperCase()}
              </div>
            )}
          </div>

          <small className="text-[#97989F] text-[12px] font-semibold">
            {book.author.first_name} {book.author.last_name}
          </small>
        </span>

        <small className="text-[#97989F] text-[12px] font-semibold ml-3">
          {FormatDate(book.published_date)}
        </small>
      </div>
    </Link>
  );
};

export default CardFooter;
