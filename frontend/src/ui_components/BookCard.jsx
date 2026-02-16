import Badge from "./Badge";
import CardFooter from "./CardFooter";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "@/api";

const BookCard = ({book, showVisibilityLabels = false}) => {
  const visibilityLabel =
    book?.visibility === "group"
      ? "Групповая"
      : book?.visibility === "personal"
        ? "Личная"
        : null;
  const averageRating = book?.average_rating;
  return (
    <div className="px-3 py-3 rounded-md w-[300px] h-auto flex flex-col gap-4 dark:border-[#1F2136] border shadow-lg">
      <Link to={`/books/${book.slug}`}>
      <div className="w-full h-[200px] border rounded-md overflow-hidden">
        <img
          src={resolveMediaUrl(book.featured_image)}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      </Link>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge book={book} />
          {showVisibilityLabels && visibilityLabel && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#E8E8EA] dark:bg-[#242535] text-[#3B3C4A] dark:text-[#BABABF]">
              {visibilityLabel}
            </span>
          )}
        </div>
        {averageRating ? (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-yellow-400">★</span>
            <span>{Number(averageRating).toFixed(1)}</span>
          </div>
        ) : (
          <div className="text-sm text-gray-400 dark:text-gray-400">Нет отзывов</div>
        )}
      </div>

      <Link to={`/books/${book.slug}`}>
        <h3
          className="font-semibold leading-normal text-[#181A2A] mb-0 dark:text-white"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '3rem',
          }}
        >
          {book.title}
        </h3>
      </Link>
      {book.book_author ? (
        <p className="text-sm text-[#3B3C4A] dark:text-[#BABABF] -mt-2">
          Автор: {book.book_author}
        </p>
      ) : (
        <p className="text-sm text-[#3B3C4A] dark:text-[#BABABF] -mt-2">
          Автор: {book.author.username || "Неизвестный автор"}
        </p>
      )}

      {book.hashtags?.length > 0 ? (() => {
        const maxChars = 38;
        let total = 0;
        let visibleCount = 0;
        for (const h of book.hashtags) {
          const len = h.name.length + 2;
          if (total + len > maxChars && visibleCount > 0) break;
          total += len;
          visibleCount++;
        }
        const hiddenCount = book.hashtags.length - visibleCount;
        return (
          <div className="flex gap-1 overflow-hidden" style={{ whiteSpace: 'nowrap' }}>
            {book.hashtags.slice(0, visibleCount).map((h) => (
              <Link
                key={h.id}
                to={`/books?tag=${h.name}`}
                className="text-xs text-[#4B6BFB] hover:underline shrink-0"
              >
                #{h.name}
              </Link>
            ))}
            {hiddenCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                и ещё {hiddenCount}
              </span>
            )}
          </div>
        );
      })() : (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          У этой книги нет хештегов
        </p>
      )}

      <CardFooter book={book} />
    </div>
  );
};

export default BookCard;
