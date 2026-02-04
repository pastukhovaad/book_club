// THIS IS TRYING TO DETAIL THE SHOWING OF BOOK PAGES (.../groups/group-name)

// import Badge from "@/ui_components/Badge";
// import BookWriter from "@/ui_components/BookWriter";
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getBookPage } from '@/services/apiBook'
import Spinner from '@/ui_components/Spinner'
// import { BASE_URL } from "@/api";
// import { HiPencilAlt } from "react-icons/hi";
// import { MdDelete } from "react-icons/md";
// import Modal from "@/ui_components/Modal";
// import CreateBookPage from "./CreateBookPage";
import { useState } from 'react'
// import { toast } from "react-toastify";
import { Link } from 'react-router-dom'

const BookPagesPage = ({ username, isAuthenticated }) => {
  const { slug } = useParams()
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  function toggleModal() {
    setShowModal((curr) => !curr)
  }

  const {
    isPending,
    isError,
    error,
    data: book,
  } = useQuery({
    queryKey: ['books', slug],
    queryFn: () => getBookPage(slug),
  })

  const bookID = book?.id

  console.log(book)

  const [currentPage, setCurrentPage] = useState(1)
  // const wordsPerPage = 220; // Define how much text per page

  if (isPending) {
    return <Spinner />
  }

  // const words = book.content.split(' ');
  // const totalPages = Math.ceil(words.length / wordsPerPage);

  // const currentText = words
  //   .slice((currentPage - 1) * wordsPerPage, currentPage * wordsPerPage)
  //   .join(' ');

  const linesPerPage = 18
  const symbolsPerLine = 75

  const lines = book.content.split('\n').flatMap((paragraph) => {
    if (!paragraph.trim()) return ['']

    const words = paragraph.split(' ')
    const wrappedLines = []
    let currentLine = ''

    words.forEach((word) => {
      if (currentLine.length + word.length + 1 > symbolsPerLine) {
        wrappedLines.push(currentLine)
        currentLine = word
      } else {
        currentLine += (currentLine.length ? ' ' : '') + word
      }
    })

    if (currentLine) wrappedLines.push(currentLine)
    return wrappedLines
  })

  const totalPages = Math.ceil(lines.length / linesPerPage)
  // const currentText = lines
  //   .slice((currentPage - 1) * linesPerPage, currentPage * linesPerPage)
  //   .join('\n');
  const pageLines = lines.slice(
    (currentPage - 1) * linesPerPage,
    currentPage * linesPerPage
  )
  const currentText = pageLines.join('\n').replace(/\n{2,}/g, '\n')

  // things like tabs

  // const symbolsPerLine = 75;
  // const linesPerPage = 18;
  // const content = book.content;
  // const lines = [];
  // const words = content.split(' ');

  // let currentLine = '';

  // words.forEach(word => {
  //   if (currentLine.length + word.length + 1 > symbolsPerLine) {
  //     lines.push(currentLine);
  //     currentLine = '';
  //   }
  //   currentLine += (currentLine.length ? ' ' : '') + word;
  // });

  // if (currentLine) {
  //   lines.push(currentLine);
  // }

  // const contentLines = content.split('\n');
  // const finalLines = [];

  // contentLines.forEach((contentLine) => {
  //   if (contentLine.trim()) {
  //     const lineWords = contentLine.split(' ');
  //     let tempLine = '';
  //     lineWords.forEach(word => {
  //       if (tempLine.length + word.length + 1 > symbolsPerLine) {
  //         finalLines.push(tempLine);
  //         tempLine = '';
  //       }
  //       tempLine += (tempLine.length ? ' ' : '') + word;
  //     });
  //     if (tempLine) finalLines.push(tempLine);
  //   } else {

  //     finalLines.push('');
  //   }
  // });

  // const totalPages = Math.ceil(finalLines.length / linesPerPage);

  // const currentText = finalLines
  //   .slice((currentPage - 1) * linesPerPage, currentPage * linesPerPage)
  //   .join('\n');

  return (
    <>
      {/* Fix rounding */}
      <div className="padding-dx max-container py-6">
        <nav className="rounded max-container padding-x py-6 flex justify-between items-center gap-6 sticky top-0 z-10 bg-[#F6F6F7] dark:bg-[#141624]">
          <Link to="/" className="text-[#141624] text-2xl dark:text-[#FFFFFF]">
            Home
          </Link>
          <Link
            to={`/books/${slug}`}
            className="text-[#141624] text-2xl dark:text-[#FFFFFF]"
          >
            {book.title}
          </Link>
          <Link to="/" className="text-[#141624] text-2xl dark:text-[#FFFFFF]">
            Главы
          </Link>
        </nav>

        <div className="column-container flex justify-between gap-4">
          <pre className="break-cancel py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-arial dark:text-[#FFFFFF]">
            {currentText}
          </pre>
        </div>

        {/* <BookWriter book={book} />  THESE BOOKS I HATE THEM

        <div className="w-full h-[350px] my-9 overflow-hidden rounded-sm">
          <img
            className="w-full h-full object-cover rounded-sm"
            src={`${BASE_URL}${book.featured_image}`}
          />
        </div>
        <p className="text-[16px] leading-[2rem] text-justify text-[#3B3C4A] dark:text-[#BABABF]">
          {book.content}
        </p> */}
      </div>
      <div className="padding-dx lower-buttons-container flex justify-between gap-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Предыдущая страница
        </button>
        <span>
          {' '}
          Страница {currentPage} из {totalPages}{' '}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Следующая страница
        </button>
      </div>

      {/* {showModal && <Modal toggleModal={toggleModal}>
        <CreateBookPage book={book} />
      </Modal>} */}
    </>
  )
}

export default BookPagesPage
