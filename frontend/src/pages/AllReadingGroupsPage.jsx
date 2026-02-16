import { useEffect, useMemo, useState } from "react";
import { getReadingGroups } from "@/services";
import ReadingGroupContainer from "@/ui_components/ReadingGroupContainer";
import PagePagination from "../ui_components/PagePagination";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";


const AllReadingGroupsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFromUrl = searchParams.get("tag") || "";
  const [page, setPage] = useState(1);
  const numOfGroupsPerPage = 9;
  const [search, setSearch] = useState("");

  const searchTerm = search.trim();
  const isTitleSearch = searchTerm.length > 0;

  const { isPending, data } = useQuery({
    queryKey: ["reading_groups", page],
    queryFn: () => getReadingGroups(page, numOfGroupsPerPage),
    placeholderData: keepPreviousData,
    enabled: !isTitleSearch,
  });

  const { data: allGroupsData } = useQuery({
    queryKey: ["reading_groups", "all"],
    queryFn: () => getReadingGroups(1, 1000),
    enabled: isTitleSearch,
    placeholderData: keepPreviousData,
  });

  const filteredGroups = useMemo(() => {
    const groups = data?.results || [];
    const allGroups = allGroupsData?.results || [];

    if (!isTitleSearch) return groups;
    const term = searchTerm.toLowerCase();
    return allGroups.filter((group) =>
      group?.name?.toLowerCase().includes(term)
    );
  }, [data?.results, allGroupsData?.results, searchTerm, isTitleSearch]);

  const displayedGroups = useMemo(() => {
    if (!isTitleSearch) return filteredGroups;
    const startIndex = (page - 1) * numOfGroupsPerPage;
    return filteredGroups.slice(startIndex, startIndex + numOfGroupsPerPage);
  }, [filteredGroups, isTitleSearch, page, numOfGroupsPerPage]);

  const numOfPages = isTitleSearch
    ? Math.ceil(filteredGroups.length / numOfGroupsPerPage)
    : Math.ceil((data?.count || 0) / numOfGroupsPerPage);

  useEffect(() => {
    setPage(1);
  }, [search]);
 

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
      
      
      <div className="flex justify-around items-center gap-4">
          <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
            Все группы
          </h2>
          <Link to={`/create_group`} className="bg-[#4B6BFB] text-white py-3 px-6 rounded-md flex gap-2">
            Создать группу
          </Link>
      </div>

      <div className="mt-4 mb-6 w-full">
                <div className="relative w-full max-w-3xl mx-auto">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (!e.target.value.trim() && tagFromUrl) {
                        searchParams.delete("tag");
                        setSearchParams(searchParams);
                      }
                    }}
                    placeholder="Искать по названию..."
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 pr-10 text-sm text-[#181A2A] dark:text-white"
                  />
                  <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
      </div>

      <ReadingGroupContainer isPending={isPending} reading_groups={displayedGroups} />
      {numOfPages > 0 ? (
      <PagePagination
        increasePageValue={increasePageValue}
        decreasePageValue={decreasePageValue}
        page={page}
        numOfPages={numOfPages}
        handleSetPage={handleSetPage}
      />
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-12 text-md">
          По вашему запросу ничего не найдено.
        </p>
      )}
      
    </div>
  );
};

export default AllReadingGroupsPage;
