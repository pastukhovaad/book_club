import NotificationCard from "./NotificationCard"
import Spinner from "./Spinner"

const NotificationContainer = ({isPending, notifications=[], title="Your notifications"}) => {

  if(isPending){
    return <Spinner />
  }

  return (
    <section className="padding-x py-6  max-container">
    {/* <h2 className="font-semibold text-xl mb-6 dark:text-white text-center">
      {title}
    </h2> */}

    <div className="flex items-center gap-6 justify-center flex-wrap">
      {notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)}
      
    </div>
  </section>
  )
}

export default NotificationContainer
