import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import InputError from "@/ui_components/InputError";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createBook, updateBook, getUserCreatedGroups, getBook } from "@/services/apiBook";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import SmallSpinner from "@/ui_components/SmallSpinner";
import SmallSpinnerText from "@/ui_components/SmallSpinnerText";
import LoginPage from "./LoginPage";
import { resolveMediaUrl } from "@/api";
import Spinner from "@/ui_components/Spinner";

const CreateBookPage = ({ book, isAuthenticated }) => {
  // If book is passed (edit mode), load full book data with all fields including content
  const {
    data: fullBook,
    isPending: isLoadingFullBook,
    isError: isFullBookError
  } = useQuery({
    queryKey: ['fullBook', book?.slug],
    queryFn: () => getBook(book.slug, false), // info_only = false to get all fields
    enabled: !!book, // Only run query if book is passed (edit mode)
  });

  // Use fullBook if available (edit mode), otherwise use passed book (which will be undefined for create mode)
  const bookData = fullBook || book;

  const { register, handleSubmit, formState, setValue } = useForm({
    defaultValues: bookData || {},
  });
  const { errors } = formState;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contentType, setContentType] = useState(bookData?.content_type || "plaintext");
  const [epubFileName, setEpubFileName] = useState("");
  const [visibility, setVisibility] = useState(bookData?.visibility || "public");
  const [selectedGroupId, setSelectedGroupId] = useState(bookData?.reading_group || "");
  const [imagePreview, setImagePreview] = useState(null);
  const [hashtags, setHashtags] = useState(bookData?.hashtags?.map((h) => h.name) || []);
  const [hashtagInput, setHashtagInput] = useState("");

  const bookID = bookData?.id;


  // Register required fields for validation (without ref, since Radix Select doesn't support it)
  useEffect(() => {
    register("category", { required: "Категория книги обязательна" });
    register("visibility", { required: "Тип книги обязателен" });
    // Set default visibility value in form when creating new book
    if (!bookData) {
      setValue("visibility", "public");
    }
  }, [register, setValue, bookData]);

  // Update form values when fullBook data is loaded
  useEffect(() => {
    if (fullBook) {
      setValue("title", fullBook.title);
      setValue("book_author", fullBook.book_author || "");
      setValue("description", fullBook.description);
      setValue("content", fullBook.content || "");
      setValue("category", fullBook.category);
      setValue("visibility", fullBook.visibility);
      setContentType(fullBook.content_type || "plaintext");
      setVisibility(fullBook.visibility || "public");
      setSelectedGroupId(fullBook.reading_group || "");
      setHashtags(fullBook.hashtags?.map((h) => h.name) || []);
    }
  }, [fullBook, setValue]);

  const { data: userGroups } = useQuery({
    queryKey: ["userCreatedGroups"],
    queryFn: getUserCreatedGroups,
  });

  const creatorGroups = userGroups || [];

  const updateMutation = useMutation({
    mutationFn: ({ data, id }) => updateBook(data, id),
    onSuccess: () => {
      navigate("/books");
      toast.success("Книга обновлена успешно!");
    },

    onError: (err) => {
      toast.error("Ошибка при обновлении книги: " + err.message);
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => createBook(data),
    onSuccess: () => {
      toast.success("Книга создана успешно.");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      navigate("/books");
    },

    onError: (err) => {
      toast.error("Ошибка при создании книги: " + err.message);
    },
  });

  function onSubmit(data) {
    if (visibility === "group" && !selectedGroupId) {
      toast.error("Выберите группу для групповой книги");
      return;
    }
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("book_author", data.book_author);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("content_type", contentType);
    formData.append("visibility", visibility);

    if (visibility === "group") {
      formData.append("reading_group", selectedGroupId);
    }

    // Add content based on content type
    if (contentType === "plaintext") {
      formData.append("content", data.content);
    } else if (contentType === "epub") {
      // Добавляем epub файл только если выбран новый файл
      if (data.epub_file && data.epub_file.length > 0 && data.epub_file[0] instanceof File) {
        formData.append("epub_file", data.epub_file[0]);
      }
    }

    // Добавляем хештеги
    hashtags.forEach((tag) => formData.append("hashtags", tag));

    // Добавляем изображение только если выбран новый файл
    if (data.featured_image && data.featured_image.length > 0 && data.featured_image[0] instanceof File) {
      formData.append("featured_image", data.featured_image[0]);
    }
    if (bookData && bookID) {
      updateMutation.mutate({ data: formData, id: bookID });
    } else {
      mutation.mutate(formData);
    }
  }

  const handleEpubFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEpubFileName(file.name);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "").toLowerCase();
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput("");
  };

  const handleRemoveHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter((t) => t !== tagToRemove));
  };

  const handleHashtagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  if (isAuthenticated === false) {
    return <LoginPage />;
  }

  // Show loading spinner while fetching full book data in edit mode
  if (book && isLoadingFullBook) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  // Show error message if failed to load full book data
  if (book && isFullBookError) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-red-500">Ошибка при загрузке данных книги</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`${
        bookData && "h-[90%] overflow-auto"
      }  md:px-16 px-8 py-6 flex flex-col mx-auto my-9 items-center gap-6 w-fit rounded-lg bg-[#FFFFFF] shadow-xl dark:text-white dark:bg-[#141624]`}
    >
      <div className="flex flex-col gap-2 justify-center items-center mb-2">
        <h3 className="font-semibold text-2xl max-sm:text-xl">
          {bookData ? "Обновить книгу" : "Создать книгу"}
        </h3>

        <p className="max-sm:text-[14px]">
          {bookData
            ? "Хотите внести изменения в свою книгу?"
            : "Создайте новую книгу и поделитесь своими идеями."}
        </p>
      </div>

      <div>
        <Label htmlFor="title" className="dark:text-[97989F]">
          Название *
        </Label>
        <Input
          type="text"
          id="title"
          {...register("title", {
            required: "Название книги обязательно",
            minLength: {
              value: 3,
              message: "Название книги должно содержать не менее 3 символов",
            },
          })}
          placeholder="Дайте название вашей книге"
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-[400px] max-sm:w-[300px] max-sm:text-[14px]"
        />

        {errors?.title?.message && <InputError error={errors.title.message} />}
      </div>

      <div>
        <Label htmlFor="book_author" className="dark:text-[97989F]">
          Автор книги
        </Label>
        <Input
          type="text"
          id="book_author"
          {...register("book_author")}
          placeholder="Укажите автора книги"
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-[400px] max-sm:w-[300px] max-sm:text-[14px]"
        />
      </div>

      <div>
        <Label htmlFor="description">Описание*</Label>
        <Textarea
          id="description"
          placeholder="Дайте краткое описание вашей книге"
          {...register("description", {
            required: "Описание книги обязательно",
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[180px]  w-[400px] text-justify max-sm:w-[300px] max-sm:text-[14px]"
        />
        {errors?.description?.message && (
          <InputError error={errors.description.message} />
        )}
      </div>

      <div className="w-full">
        <Label className="dark:text-[97989F]">Тип содержимого *</Label>
        <div className="flex gap-6 mt-2 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="plaintext"
              name="content_type"
              value="plaintext"
              checked={contentType === "plaintext"}
              onChange={(e) => setContentType(e.target.value)}
              className="w-4 h-4 cursor-pointer"
            />
            <Label htmlFor="plaintext" className="cursor-pointer font-normal">
              Обычный текст
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="epub"
              name="content_type"
              value="epub"
              checked={contentType === "epub"}
              onChange={(e) => setContentType(e.target.value)}
              className="w-4 h-4 cursor-pointer"
            />
            <Label htmlFor="epub" className="cursor-pointer font-normal">
              EPUB файл
            </Label>
          </div>
        </div>
      </div>

      {contentType === "plaintext" ? (
        <div>
          <Label htmlFor="content">Содержимое *</Label>
          <Textarea
            id="content"
            placeholder="Вставьте вашу книгу здесь"
            {...register("content", {
              required: contentType === "plaintext" ? "Содержимое книги обязательно" : false,
              minLength: {
                value: 10,
                message: "Книга должна содержать не менее 10 символов",
              },
            })}
            className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[180px]  w-[400px] text-justify max-sm:w-[300px] max-sm:text-[14px]"
          />
          {errors?.content?.message && (
            <InputError error={errors.content.message} />
          )}
        </div>
      ) : (
        <div className="w-full">
          <Label htmlFor="epub_file">EPUB файл {!bookData && "*"}</Label>
          <Input
            type="file"
            id="epub_file"
            accept=".epub"
            {...register("epub_file", {
              required: contentType === "epub" && !bookData ? "EPUB файл обязателен" : false,
            })}
            onChange={handleEpubFileChange}
            className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full max-sm:w-[300px] max-sm:text-[14px]"
          />
          {epubFileName && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Выбран файл: {epubFileName}
            </p>
          )}
          {bookData && contentType === "epub" && (
            <p className="text-[12px] text-gray-500 mt-2">
              Оставьте пустым, чтобы сохранить текущий EPUB файл.
            </p>
          )}
          {errors?.epub_file?.message && (
            <InputError error={errors.epub_file.message} />
          )}
        </div>
      )}

      <div className="w-full">
        <Label htmlFor="category">Категория *</Label>

        <Select
          onValueChange={(value) => setValue("category", value, { shouldValidate: true })}
          defaultValue={bookData ? bookData.category : ""}
        >
          <SelectTrigger className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full max-sm:w-[300px] max-sm:text-[14px]">
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>

              <SelectItem value="classic">Классика</SelectItem>
              <SelectItem value="fantasy">Фэнтези</SelectItem>
              <SelectItem value="detective_fiction">Детектив</SelectItem>
              <SelectItem value="thriller">Триллер</SelectItem>
              <SelectItem value="romance">Романтика</SelectItem>
              <SelectItem value="horror">Ужасы</SelectItem>
              <SelectItem value="adventure">Приключения</SelectItem>
              <SelectItem value="science_fiction">Научная фантастика</SelectItem>
              <SelectItem value="biography">Биография</SelectItem>
              <SelectItem value="self_help">Саморазвитие</SelectItem>
              <SelectItem value="poetry">Поэзия</SelectItem>
              <SelectItem value="children">Детская литература</SelectItem>
              <SelectItem value="non_fiction">Документальная литература</SelectItem>
              <SelectItem value="business">Бизнес и экономика</SelectItem>
              <SelectItem value="other">Другое</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {errors?.category?.message && (
          <InputError error={errors.category.message} />
        )}
      </div>

      <div className="w-full">
        <Label>Хештеги</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleHashtagKeyDown}
            placeholder="Введите хештег"
            className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] flex-1 max-sm:text-[14px]"
          />
          <button
            type="button"
            onClick={handleAddHashtag}
            className="bg-[#4B6BFB] text-white px-4 rounded-md text-sm"
          >
            +
          </button>
        </div>
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#4B6BFB]/10 text-[#4B6BFB] text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveHashtag(tag)}
                  className="ml-1 text-[#4B6BFB] hover:text-red-500 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
            <Label className="dark:text-[97989F]">Тип книги *</Label>
            <div className="flex flex-col gap-3 mt-2 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="visibility_public"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={(e) => {
                    setVisibility(e.target.value);
                    setSelectedGroupId("");
                    setValue("visibility", e.target.value, { shouldValidate: true });
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="visibility_public" className="cursor-pointer font-normal">
                  Публичная (видимая всем)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="visibility_group"
                  name="visibility"
                  value="group"
                  checked={visibility === "group"}
                  onChange={(e) => {
                    setVisibility(e.target.value);
                    setValue("visibility", e.target.value, { shouldValidate: true });
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="visibility_group" className="cursor-pointer font-normal">
                  Групповая (видимая только членам вашей группы)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="visibility_personal"
                  name="visibility"
                  value="personal"
                  checked={visibility === "personal"}
                  onChange={(e) => {
                    setVisibility(e.target.value);
                    setSelectedGroupId("");
                    setValue("visibility", e.target.value, { shouldValidate: true });
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="visibility_personal" className="cursor-pointer font-normal">
                  Личная (видимая только вам)
                </Label>
              </div>
            </div>
            {errors?.visibility?.message && (
              <InputError error={errors.visibility.message} />
            )}
          </div>

          {visibility === "group" && (
            <div className="w-full">
              <Label htmlFor="reading_group">Группа *</Label>
              <Select
                onValueChange={(value) => {
                  setSelectedGroupId(value);
                  setValue("reading_group", value, { shouldValidate: true });
                }}
                defaultValue={bookData?.reading_group ? String(bookData.reading_group) : ""}
                disabled={creatorGroups.length === 0}
              >
                <SelectTrigger className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full max-sm:w-[300px] max-sm:text-[14px]">
                  <SelectValue
                    placeholder={
                      creatorGroups.length === 0
                        ? "У вас нет групп, где вы создатель"
                        : "Выберите группу"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Группы</SelectLabel>
                    {creatorGroups.length === 0 ? (
                      <SelectItem value="no-groups" disabled>
                        У вас нет групп, где вы создатель
                      </SelectItem>
                    ) : (
                      creatorGroups.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {!selectedGroupId && creatorGroups.length > 0 && (
                <InputError error="Выберите группу для групповой книги" />
              )}
            </div>
          )}

      <div className="w-full">
        <Label htmlFor="featured_image">Изображение книги {!bookData && "*"}</Label>

        {/* Отображение текущего изображения */}
        {!imagePreview && bookData?.featured_image && (
          <div className="mb-3">
            <img
              src={resolveMediaUrl(bookData.featured_image)}
              alt="Current book cover"
              className="h-40 w-40 rounded-lg object-cover border-2 border-[#141624] dark:border-[#3B3C4A]"
            />
            <p className="text-[12px] text-gray-500 mt-2">Текущее изображение</p>
          </div>
        )}

        {/* Отображение превью нового изображения */}
        {imagePreview && (
          <div className="mb-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-40 w-40 rounded-lg object-cover border-2 border-[#4B6BFB]"
            />
            <p className="text-[12px] text-blue-500 mt-2">Новое изображение</p>
          </div>
        )}

        <Input
          type="file"
          id="picture"
          accept="image/*"
          {...register("featured_image", {
            required: bookData ? false : "Изображение книги обязательно",
          })}
          onChange={handleImageChange}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full max-sm:w-[300px] max-sm:text-[14px]"
        />

        {bookData && (
          <p className="text-[12px] text-gray-500 mt-2">
            Оставьте пустым, чтобы сохранить текущее изображение.
          </p>
        )}

        {errors?.featured_image?.message && (
          <InputError error={errors.featured_image.message} />
        )}
      </div>

      <div className="w-full flex items-center justify-center flex-col my-4">
        {bookData ? (
          <button
            disabled={updateMutation.isPending}
            className="bg-[#4B6BFB] text-white w-full py-3 px-2 rounded-md flex items-center justify-center gap-2"
          >
            {updateMutation.isPending ? (
              <>
                {" "}
                <SmallSpinner /> <SmallSpinnerText text="Обновление книги..." />{" "}
              </>
            ) : (
              <SmallSpinnerText text="Обновить книгу" />
            )}
          </button>
        ) : (
          <button
            disabled={mutation.isPending}
            className="bg-[#4B6BFB] text-white w-full py-3 px-2 rounded-md flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                {" "}
                <SmallSpinner /> <SmallSpinnerText text="Создание книги..." />{" "}
              </>
            ) : (
              <SmallSpinnerText text="Создать книгу" />
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default CreateBookPage;
