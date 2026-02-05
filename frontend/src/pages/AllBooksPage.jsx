import { useEffect, useMemo, useState } from "react";
import { getBooks } from "@/services/apiBook";
import BookContainer from "@/ui_components/BookContainer";
import PagePagination from "../ui_components/PagePagination";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";


const AllBooksPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const numOfBooksPerPage = 9;
  const isSearching = search.trim().length > 0;

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["books", page],
    queryFn: () => getBooks(page, numOfBooksPerPage),
    placeholderData: keepPreviousData,
  });

  const { data: allBooksData } = useQuery({
    queryKey: ["books", "all"],
    queryFn: () => getBooks(1, 1000),
    enabled: isSearching,
    placeholderData: keepPreviousData,
  });

  const books = data?.results || [];
  const allBooks = allBooksData?.results || [];
  const filteredBooks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return books;
    return allBooks.filter((book) =>
      book?.title?.toLowerCase().includes(term)
    );
  }, [books, allBooks, search]);
  const displayedBooks = useMemo(() => {
    if (!isSearching) return filteredBooks;
    const startIndex = (page - 1) * numOfBooksPerPage;
    return filteredBooks.slice(startIndex, startIndex + numOfBooksPerPage);
  }, [filteredBooks, isSearching, page]);
  const numOfPages = isSearching
    ? Math.ceil(filteredBooks.length / numOfBooksPerPage)
    : Math.ceil(data?.count / numOfBooksPerPage);
  console.log(books);
  useEffect(() => {
    if (isSearching) {
      setPage(1);
    }
  }, [isSearching, search]);
 

  function handleSetPage(val) {
    setPage(val);
  }

  function increasePageValue() {
    setPage((curr) => curr + 1);
  }

  function decreasePageValue() {
    setPage((curr) => curr - 1);
  }



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
        <div className="mt-4 mb-6 w-full">
          <div className="relative w-full max-w-3xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Искать..."
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 pr-10 text-sm text-[#181A2A] dark:text-white"
            />
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      <BookContainer isPending={isPending} books={displayedBooks} />
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
