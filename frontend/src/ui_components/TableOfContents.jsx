import { IoCloseOutline } from 'react-icons/io5';

const TableOfContents = ({
  tocItems,
  chaptersData,
  onChapterClick,
  onClose,
  isOpen,
}) => {
  if (!isOpen) return null;

  const hasEpubToc = tocItems && tocItems.length > 0;
  const hasChapters = chaptersData?.chapters && chaptersData.chapters.length > 0;

  return (
    <div
      className="w-80 bg-white dark:bg-[#141624] border-l dark:border-gray-700 overflow-y-auto"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white dark:bg-[#141624] border-b dark:border-gray-700 px-4 py-3 flex justify-between items-center z-10">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Главы
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <IoCloseOutline size={24} />
        </button>
      </div>
      <div className="p-4">
        {hasEpubToc ? (
          <ul className="space-y-2">
            {tocItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => {
                    if (item.href) {
                      onChapterClick(item.href);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    item.href
                      ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer'
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  style={{ paddingLeft: `${(item.level || 0) * 12 + 12}px` }}
                  disabled={!item.href}
                >
                  {item.label || item.title || `Chapter ${index + 1}`}
                </button>
              </li>
            ))}
          </ul>
        ) : hasChapters ? (
          <ul className="space-y-2">
            {chaptersData.chapters.map((chapter, index) => (
              <li key={chapter.id || index}>
                <button
                  onClick={() => {
                    if (chapter.href) {
                      onChapterClick(chapter.href);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    chapter.href
                      ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer'
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!chapter.href}
                >
                  {chapter.title || `Chapter ${index + 1}`}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No chapters available
          </p>
        )}
      </div>
    </div>
  );
};

export default TableOfContents;
