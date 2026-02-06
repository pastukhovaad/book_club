// THIS DETAILS THE SHOWING OF BOOKS (.../books/book-name)

import Badge from '@/ui_components/Badge'
import BookWriter from '@/ui_components/BookWriter'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { createBookReview, deleteBook, getBook, getBookReviews, getReadingProgress } from '@/services/apiBook'
import Spinner from '@/ui_components/Spinner'
import { resolveMediaUrl } from '@/api'
import { HiPencilAlt } from 'react-icons/hi'
import { MdDelete } from 'react-icons/md'
import Modal from '@/ui_components/Modal'
import CreateBookPage from './CreateBookPage'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { FormatDate } from '@/services/formatDate'

const DetailPage = ({ username, isAuthenticated }) => {
  const { slug } = useParams()
  const [showModal, setShowModal] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewDescription, setReviewDescription] = useState('')
  const [reviewStars, setReviewStars] = useState(5)
  const navigate = useNavigate()
  function toggleModal() {
    setShowModal((curr) => !curr)
  }
  const infoOnly = true
  const {
    isPending,
    isError,
    error,
    data: book,
  } = useQuery({
    queryKey: ['books', slug],
    queryFn: () => getBook(slug,infoOnly),
  })

  const {
    isPending: isReviewsPending,
    data: reviews = [],
  } = useQuery({
    queryKey: ['bookReviews', slug],
    queryFn: () => getBookReviews(slug),
  })

  const { data: readingProgress } = useQuery({
    queryKey: ['readingProgress', slug],
    queryFn: () => getReadingProgress(slug),
    enabled: isAuthenticated,
  })

  const bookID = book?.id

  // removed debug console.log to avoid duplicate logs

  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBook(id),
    onSuccess: () => {
      toast.success('Ваша книга была успешно удалена!')
      navigate('/')
    },

    onError: (err) => {
      console.log(err)
      toast.error(err.message)
    },
  })

  const createReviewMutation = useMutation({
    mutationFn: (data) => createBookReview(slug, data),
    onSuccess: () => {
      toast.success('Отзыв отправлен')
      setReviewTitle('')
      setReviewDescription('')
      setReviewStars(5)
      setShowReviewForm(false)
      queryClient.invalidateQueries({ queryKey: ['bookReviews', slug] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  function handleDeleteBook() {
    const popUp = window.confirm('Вы уверены, что хотите удалить эту книгу?')
    if (!popUp) {
      return
    }

    deleteMutation.mutate(bookID)
  }

  if (isPending) {
    return <Spinner />
  }

  function handleSubmitReview(e) {
    e.preventDefault()
    createReviewMutation.mutate({
      title: reviewTitle.trim() || null,
      description: reviewDescription.trim(),
      stars_amount: Number(reviewStars),
    })
  }

  return (
    <>
      <div className="padding-dx max-container py-9">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="py-6 leading-normal text-2xl md:text-3xl text-[#181A2A] tracking-wide font-semibold dark:text-[#FFFFFF]">
            {book.title}
          </h2>

          <div className="flex items-center gap-4">
            <Link
              to={`/books/${slug}/page`}
              className="bg-[#4B6BFB] text-white py-3 px-6 rounded-md flex gap-2"
            >
              Читать книгу
            </Link>
            {isAuthenticated && (
              <span className="text-sm text-[#3B3C4A] dark:text-[#BABABF]">
                {readingProgress?.is_completed
                  ? 'Прочитано'
                  : `Прогресс: ${Math.round(readingProgress?.progress_percent ?? 0)}%`}
              </span>
            )}

            {isAuthenticated && username === book.author.username && (
              <span className="flex items-center gap-2">
                <HiPencilAlt
                  onClick={toggleModal}
                  className="dark:text-white text-3xl cursor-pointer"
                />
                <MdDelete
                  onClick={handleDeleteBook}
                  className="dark:text-white text-3xl cursor-pointer"
                />
              </span>
            )}
          </div>
        </div>

        <BookWriter book={book} />

        <div className="flex flex-col md:flex-row gap-8 my-9">
          <div className="w-full md:w-[280px] flex-shrink-0">
            <div className="aspect-[2/3] overflow-hidden rounded-sm">
              <img
                className="w-full h-full object-cover rounded-sm"
                src={resolveMediaUrl(book.featured_image)}
                alt={book.title}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge book={book} />
              {book.hashtags?.map((h) => (
                <Link
                  key={h.id}
                  to={`/books?tag=${h.name}`}
                  className="text-sm px-3 py-1 rounded-full bg-[#4B6BFB]/10 text-[#4B6BFB] hover:bg-[#4B6BFB]/20 transition-colors"
                >
                  #{h.name}
                </Link>
              ))}
            </div>
            {book.book_author && (
              <p className="text-[15px] text-[#3B3C4A] dark:text-[#BABABF] mb-4">
                <span className="font-semibold">Автор:</span> {book.book_author}
              </p>
            )}
            <h3 className="text-xl font-semibold text-[#181A2A] dark:text-white mb-2">
              О книге
            </h3>
            <p className="text-[16px] leading-[2rem] text-justify text-[#3B3C4A] dark:text-[#BABABF]">
              {book.description || "У этой книги нет описания."}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-semibold text-[#181A2A] dark:text-white">
            Отзывы
          </h3>
          {book.average_rating ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5 text-xl">
                {[1, 2, 3, 4, 5].map((value) => (
                  <span
                    key={value}
                    className={
                      value <= Math.round(Number(book.average_rating))
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {Number(book.average_rating).toFixed(1)} / 5
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                ({reviews.length})
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              Нет оценок
            </p>
          )}

          {isAuthenticated ? (
            <div className="mt-4">
              {reviews.some((r) => r.user?.username === username) ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Вы уже оставили отзыв на эту книгу.
                </p>
              ) : (
              <button
                type="button"
                onClick={() => setShowReviewForm((prev) => !prev)}
                className="rounded-md bg-[#4B6BFB] px-4 py-2 text-white"
              >
                Оставить отзыв
              </button>
              )}

              {showReviewForm && (
                <form
                  onSubmit={handleSubmitReview}
                  className="mt-4 space-y-4 rounded-md border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                      Заголовок (необязательно)
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-[#181A2A] dark:text-white"
                      placeholder="Коротко о книге"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                      Описание (необязательно)
                    </label>
                    <textarea
                      value={reviewDescription}
                      onChange={(e) => setReviewDescription(e.target.value)}
                      className="min-h-[120px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-[#181A2A] dark:text-white"
                      placeholder="Ваши впечатления о книге"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                      Оценка
                    </label>
                    <select
                      value={reviewStars}
                      onChange={(e) => setReviewStars(e.target.value)}
                      className="w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-[#181A2A] dark:text-white"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="rounded-md bg-[#4B6BFB] px-4 py-2 text-white"
                    disabled={createReviewMutation.isPending}
                  >
                    {createReviewMutation.isPending
                      ? 'Отправка...'
                      : 'Отправить отзыв'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Войдите в аккаунт, чтобы оставить отзыв.
            </p>
          )}

          <div className="mt-6 space-y-4">
            {isReviewsPending ? (
              <Spinner />
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Пока нет отзывов.
              </p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-md border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    {review.user?.username ? (
                      <Link
                        to={`/profile/${review.user.username}`}
                        className="flex items-center gap-3"
                      >
                        {review.user.profile_picture ? (
                          <img
                            src={resolveMediaUrl(review.user.profile_picture)}
                            alt={review.user.username}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                            {review.user.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-md text-gray-600 dark:text-gray-300">
                            {review.user.username}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {review.creation_date ? FormatDate(review.creation_date) : ''}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <div className="text-md text-gray-600 dark:text-gray-300">
                        Пользователь
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="text-2xl flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <span
                            key={value}
                            className={
                              value <= review.stars_amount
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-md text-gray-500 dark:text-gray-400">
                        ({review.stars_amount}/5)
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 font-semibold text-[#181A2A] dark:text-white">
                    {review.title}
                  </p>
                  {review.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {review.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal toggleModal={toggleModal}>
          <CreateBookPage book={book} />
        </Modal>
      )}
    </>
  )
}

export default DetailPage
