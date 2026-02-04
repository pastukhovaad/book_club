import { useState } from 'react'
import { getNotifications, getUsername } from '@/services/apiBook'
import NotificationContainer from '@/ui_components/NotificationContainer'
import PagePagination from '../ui_components/PagePagination'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

const AllBooksPage = ( { authUsername } ) => {
  const [page, setPage] = useState(1)
  const numOfNotificationsPerPage = 9

  const { isPending, isError, error, data } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotifications(page, numOfNotificationsPerPage),
    placeholderData: keepPreviousData,
  })

  const notifications = data?.results || []
  console.log(authUsername)
  console.log(notifications)
  const numOfPages = Math.ceil(data?.count / numOfNotificationsPerPage)
  console.log(numOfPages)
  console.log(page)

  function handleSetPage(val) {
    setPage(val)
  }

  function increasePageValue() {
    setPage((curr) => curr + 1)
  }

  function decreasePageValue() {
    setPage((curr) => curr - 1)
  }

  return (
    <div className="padding-y  max-container">
      <div className="flex justify-around items-center gap-4">
        <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
          Ваши уведомления
        </h2>
      </div>
      {/* TODO: Make NotificationContainer and NotificationCard */}
      <NotificationContainer isPending={isPending} notifications={notifications} />
      <PagePagination
        increasePageValue={increasePageValue}
        decreasePageValue={decreasePageValue}
        page={page}
        numOfPages={numOfPages}
        handleSetPage={handleSetPage}
      />
    </div>
  )
}

export default AllBooksPage
