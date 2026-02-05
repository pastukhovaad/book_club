import { useState } from "react";
import { getPublicBooks, getReadingGroups, getRecentReadingBooks } from "@/services/apiBook";
import BookContainer from "@/ui_components/BookContainer";
import Header from "@/ui_components/Header";
import PagePagination from "../ui_components/PagePagination";
import ReadingGroupContainer from "@/ui_components/ReadingGroupContainer";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const HomePage = () => {
  const [recentPage, setRecentPage] = useState(1);
  const [booksPage, setBooksPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const numOfBooksPerPage = 3;
  const hasToken = !!localStorage.getItem('access');

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["books", booksPage],
    queryFn: () => getPublicBooks(booksPage, numOfBooksPerPage),
    placeholderData: keepPreviousData,
  });

  const { isPending: recentPending, data: recentData } = useQuery({
    queryKey: ["recentReading", recentPage],
    queryFn: () => getRecentReadingBooks(recentPage, numOfBooksPerPage),
    enabled: hasToken,
    placeholderData: keepPreviousData,
  });

  const { isPending: groupsPending, data: groupsData } = useQuery({
    queryKey: ["reading_groups", groupsPage],
    queryFn: () => getReadingGroups(groupsPage, numOfBooksPerPage),
    placeholderData: keepPreviousData,
  });

  const books = data?.results || [];
  const recentBooks = recentData?.results || [];
  const reading_groups = groupsData?.results || [];
  const numOfPages = Math.ceil(data?.count / numOfBooksPerPage);
  const numOfPagesRecent = Math.ceil(recentData?.count / numOfBooksPerPage);
  const numOfPagesGroups = Math.ceil(groupsData?.count / numOfBooksPerPage);

  function handleSetRecentPage(val) {
    setRecentPage(val);
  }

  function increaseRecentPage() {
    setRecentPage((curr) => curr + 1);
  }

  function decreaseRecentPage() {
    setRecentPage((curr) => curr - 1);
  }

  function handleSetBooksPage(val) {
    setBooksPage(val);
  }

  function increaseBooksPage() {
    setBooksPage((curr) => curr + 1);
  }

  function decreaseBooksPage() {
    setBooksPage((curr) => curr - 1);
  }

  function handleSetGroupsPage(val) {
    setGroupsPage(val);
  }

  function increaseGroupsPage() {
    setGroupsPage((curr) => curr + 1);
  }

  function decreaseGroupsPage() {
    setGroupsPage((curr) => curr - 1);
  }

  return (
    <>
      <Header />
      <section className="py-6 max-container">
          <section className="text-center">
            <Link to='/books' className="font-semibold text-xl mb-6 dark:text-white">
              Вы недавно читали
            </Link>
            {hasToken ? (
              <>
                <BookContainer isPending={recentPending} books={recentBooks} />
                <PagePagination
                  increasePageValue={increaseRecentPage}
                  decreasePageValue={decreaseRecentPage}
                  page={recentPage}
                  numOfPages={numOfPagesRecent}
                  handleSetPage={handleSetRecentPage}
                />
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Войдите, чтобы видеть последние прочитанные книги.
              </p>
            )}
          </section>
      </section>
      <section className="py-6 max-container">
          <section className="text-center">
          <Link to='/books' className="font-semibold text-xl mb-6 dark:text-white">
            Недавно выложенные книги
          </Link>
          <BookContainer isPending={isPending} books={books} />
          <PagePagination
            increasePageValue={increaseBooksPage}
            decreasePageValue={decreaseBooksPage}
            page={booksPage}
            numOfPages={numOfPages}
            handleSetPage={handleSetBooksPage}
          />
          </section>
      </section>
      <section className="py-6 max-container">
        <section className="text-center">
        <Link to='/groups' className="font-semibold text-xl mb-6 dark:text-white">
          Все группы
        </Link>
        </section>
        <ReadingGroupContainer isPending={groupsPending} reading_groups={reading_groups} />
        <PagePagination
          increasePageValue={increaseGroupsPage}
          decreasePageValue={decreaseGroupsPage}
          page={groupsPage}
          numOfPages={numOfPagesGroups}
          handleSetPage={handleSetGroupsPage}
        />
      </section>
    </>
  );
};

export default HomePage;
