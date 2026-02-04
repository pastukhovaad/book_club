import Badge from "./Badge";
import CardFooter from "./CardFooter";
import thumbnail from "../images/design_vii.jpg";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "@/api";

const BookCard = ({book, showVisibilityLabels = false}) => {
  const visibilityLabel =
    book?.visibility === "group"
      ? "Групповая"
      : book?.visibility === "personal"
        ? "Личная"
        : null;
  return (
    <div className="px-3 py-3 rounded-md w-[300px] h-auto flex flex-col gap-4 dark:border-gray-800 border shadow-lg">
      <Link to={`/books/${book.slug}`}>
      <div className="w-full h-[200px] border rounded-md overflow-hidden">
        <img
          src={resolveMediaUrl(book.featured_image)}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      </Link>

      <div className="flex items-center gap-2">
        <Badge book={book} />
        {showVisibilityLabels && visibilityLabel && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#E8E8EA] dark:bg-[#242535] text-[#3B3C4A] dark:text-[#BABABF]">
            {visibilityLabel}
          </span>
        )}
      </div>

      <Link to={`/books/${book.slug}`}>
        <h3 className="font-semibold  leading-normal text-[#181A2A] mb-0 dark:text-white">
          {book.title}
        </h3>
      </Link>

      <CardFooter book={book} />
    </div>
  );
};

export default BookCard;
