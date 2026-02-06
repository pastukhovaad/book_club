import { useEffect, useMemo, useState } from "react";
import { getBooks, searchBooksByHashtag } from "@/services/apiBook";
import BookContainer from "@/ui_components/BookContainer";
import PagePagination from "../ui_components/PagePagination";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";


const AllBooksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFromUrl = searchParams.get("tag") || "";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const numOfBooksPerPage = 9;

  // Определяем тип поиска
  const searchTerm = search.trim();
  const isHashtagSearch = searchTerm.startsWith("#") && searchTerm.length > 1;
  const searchHashtag = isHashtagSearch ? searchTerm.slice(1).toLowerCase() : "";
  const isTitleSearch = searchTerm.length > 0 && !isHashtagSearch;
  const isTagFiltering = tagFromUrl.length > 0;

  // Активный хештег — либо из URL, либо из строки поиска
  const activeTag = isTagFiltering ? tagFromUrl : searchHashtag;
  const isActiveTagSearch = activeTag.length > 0;

  // Обычный запрос книг (без фильтра по хештегу)
  const { isPending, data } = useQuery({
    queryKey: ["books", page],
    queryFn: () => getBooks(page, numOfBooksPerPage),
    placeholderData: keepPreviousData,
    enabled: !isActiveTagSearch,
  });

  // Запрос книг по хештегу (из URL или из строки поиска)
  const { isPending: isTagPending, data: tagData } = useQuery({
    queryKey: ["books", "hashtag", activeTag, page],
    queryFn: () => searchBooksByHashtag(activeTag, page, numOfBooksPerPage),
    placeholderData: keepPreviousData,
    enabled: isActiveTagSearch,
  });

  // Загрузка всех книг для клиентской фильтрации по названию
  const { data: allBooksData } = useQuery({
    queryKey: ["books", "all"],
    queryFn: () => getBooks(1, 1000),
    enabled: isTitleSearch,
    placeholderData: keepPreviousData,
  });

  const books = isActiveTagSearch ? (tagData?.results || []) : (data?.results || []);
  const allBooks = allBooksData?.results || [];

  const filteredBooks = useMemo(() => {
    if (isActiveTagSearch) return books;
    if (!isTitleSearch) return books;
    const term = searchTerm.toLowerCase();
    return allBooks.filter((book) =>
      book?.title?.toLowerCase().includes(term)
    );
  }, [books, allBooks, searchTerm, isActiveTagSearch, isTitleSearch]);

  const displayedBooks = useMemo(() => {
    if (isActiveTagSearch) return filteredBooks;
    if (!isTitleSearch) return filteredBooks;
    const startIndex = (page - 1) * numOfBooksPerPage;
    return filteredBooks.slice(startIndex, startIndex + numOfBooksPerPage);
  }, [filteredBooks, isTitleSearch, isActiveTagSearch, page]);

  const numOfPages = isActiveTagSearch
    ? Math.ceil((tagData?.count || 0) / numOfBooksPerPage)
    : isTitleSearch
      ? Math.ceil(filteredBooks.length / numOfBooksPerPage)
      : Math.ceil((data?.count || 0) / numOfBooksPerPage);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [tagFromUrl]);

  // Если перешли по ссылке с ?tag=, подставляем хештег в строку поиска
  useEffect(() => {
    if (tagFromUrl) {
      setSearch(`#${tagFromUrl}`);
    }
  }, [tagFromUrl]);

  function handleSetPage(val) {
    setPage(val);
  }

  function increasePageValue() {
    setPage((curr) => curr + 1);
  }

  function decreasePageValue() {
    setPage((curr) => curr - 1);
  }

  function clearTagFilter() {
    searchParams.delete("tag");
    setSearchParams(searchParams);
    setSearch("");
    setPage(1);
  }

  const loading = isActiveTagSearch ? isTagPending : isPending;

  return (
    <div className="padding-y  max-container">


        <div className="flex flex-col md:flex-row justify-around items-center gap-4">
          <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
            Все книги
          </h2>
          <Link to={`/create_book`} className="bg-[#4B6BFB] text-white py-3 px-6 rounded-md flex gap-2">
            Создать книгу
          </Link>
        </div>

        {isTagFiltering && (
          <div className="flex items-center gap-2 mb-4 max-w-3xl mx-auto">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Фильтр по хештегу:
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#4B6BFB]/10 text-[#4B6BFB] text-sm font-medium">
              #{tagFromUrl}
              <button
                onClick={clearTagFilter}
                className="ml-1 text-[#4B6BFB] hover:text-red-500 font-bold"
              >
                &times;
              </button>
            </span>
          </div>
        )}

        <div className="mt-4 mb-6 w-full">
          <div className="relative w-full max-w-3xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // Если пользователь очищает строку, убираем фильтр из URL
                if (!e.target.value.trim() && tagFromUrl) {
                  searchParams.delete("tag");
                  setSearchParams(searchParams);
                }
              }}
              placeholder="Искать по названию или #хештегу..."
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 pr-10 text-sm text-[#181A2A] dark:text-white"
            />
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      <BookContainer isPending={loading} books={displayedBooks} />
      {numOfPages > 0 ? (
        <PagePagination
          increasePageValue={increasePageValue}
          decreasePageValue={decreasePageValue}
          page={page}
          numOfPages={numOfPages}
          handleSetPage={handleSetPage}
        />
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-12 text-lg">
          По вашему запросу ничего не найдено.
        </p>
      )}
    </div>
  );
};

export default AllBooksPage;
