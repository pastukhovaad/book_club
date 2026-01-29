import { useState } from "react";
import { getReadingGroups } from "@/services/apiBook";
import ReadingGroupContainer from "@/ui_components/ReadingGroupContainer";
import PagePagination from "../ui_components/PagePagination";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";


const AllReadingGroupsPage = () => {
  const [page, setPage] = useState(1);
  const numOfGroupsPerPage = 9;

  const { isPending, isError, error, data } = useQuery({
    queryKey: ["reading_groups", page],
    queryFn: () => getReadingGroups(page, numOfGroupsPerPage),
    placeholderData: keepPreviousData,
  });

  const reading_groups = data?.results || [];
  console.log(reading_groups);
  const numOfPages = Math.ceil(data?.count / numOfGroupsPerPage);
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
    <div className="padding-y  max-container">
      
      
        <div className="flex justify-around items-center gap-4">
          <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
            Все группы
          </h2>
          <Link to={`/create_group`} className="bg-[#4B6BFB] text-white py-3 px-6 rounded-md flex gap-2">
            Создать группу
          </Link>
        </div>
      <ReadingGroupContainer isPending={isPending} reading_groups={reading_groups} />
      <PagePagination
        increasePageValue={increasePageValue}
        decreasePageValue={decreasePageValue}
        page={page}
        numOfPages={numOfPages}
        handleSetPage={handleSetPage}
      />
    </div>
  );
};

export default AllReadingGroupsPage;
