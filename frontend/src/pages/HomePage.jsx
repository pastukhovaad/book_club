import { useState } from "react";
import { getBooks } from "@/services/apiBook";
import BookContainer from "@/ui_components/BookContainer";
import Header from "@/ui_components/Header";
import PagePagination from "../ui_components/PagePagination";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

const HomePage = () => {
  const [page, setPage] = useState(1);
  const numOfBooksPerPage = 3;

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["books", page],
    queryFn: () => getBooks(page, numOfBooksPerPage),
    placeholderData: keepPreviousData,
  });

  const books = data?.results || [];
  console.log(books);
  const numOfPages = Math.ceil(data?.count / numOfBooksPerPage);
  console.log(numOfPages);
  console.log(page);

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
    <>
      <Header />
      <section className="py-6 max-container">
          <h2 className="font-semibold text-xl mb-6 dark:text-white text-center">
            Последние книги
          </h2>
          <BookContainer isPending={isPending} books={books} />
          <PagePagination
            increasePageValue={increasePageValue}
            decreasePageValue={decreasePageValue}
            page={page}
            numOfPages={numOfPages}
            handleSetPage={handleSetPage}
          />
          
      </section>
    </>
  );
};

export default HomePage;
