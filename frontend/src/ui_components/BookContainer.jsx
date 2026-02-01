import BookCard from "./BookCard"
import Spinner from "./Spinner"

const BookContainer = ({isPending, books=[], title=""}) => {

  if(isPending){
    return <Spinner />
  }

  return (
    <section className="padding-x py-6  max-container">
    {title && (
      <h2 className="font-semibold text-xl mb-6 dark:text-white text-center">
        {title}
      </h2>
    )}

    <div className="flex items-center gap-6 justify-center flex-wrap">
      {books.map((book) => <BookCard key={book.id} book={book} />)}
      
    </div>
  </section>
  )
}

export default BookContainer
