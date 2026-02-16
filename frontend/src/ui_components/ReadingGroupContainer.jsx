import ReadingGroupCard from "./ReadingGroupCard"
import Spinner from "./Spinner"

const ReadingGroupContainer = ({isPending, reading_groups=[]}) => {

  if(isPending){
    return <Spinner />
  }

  return (
    <section className="padding-x py-6  max-container">
    <div className="flex items-center gap-6 justify-center flex-wrap">
      {reading_groups.map((reading_group) => <ReadingGroupCard key={reading_group.id} reading_group={reading_group} />)}
      
        </div>
    </section>
  )
}

export default ReadingGroupContainer