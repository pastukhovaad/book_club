import NotificationCard from "./NotificationCard"
import Spinner from "./Spinner"

const NotificationContainer = ({isPending, notifications=[]}) => {

  if(isPending){
    return <Spinner />
  }

  return (
    <section className="padding-x py-6 max-container">
    {notifications.length === 0 ? (
      <p className="flex justify-center text-s text-[#3B3C4A] dark:text-[#BABABF]">У вас нет уведомлений.</p>
    ) : (
      <div className="flex items-center gap-6 justify-center flex-wrap">
        {notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)}
      </div>
    )}
  </section>
  )
}

export default NotificationContainer
