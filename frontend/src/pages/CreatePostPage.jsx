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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBook, updateBook } from "@/services/apiBook";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import SmallSpinner from "@/ui_components/SmallSpinner";
import SmallSpinnerText from "@/ui_components/SmallSpinnerText";
import LoginPage from "./LoginPage";

const CreatePostPage = ({ book, isAuthenticated }) => {
  const { register, handleSubmit, formState, setValue } = useForm({
    defaultValues: book ? book : {},
  });
  const { errors } = formState;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contentType, setContentType] = useState(book?.content_type || "plaintext");
  const [epubFileName, setEpubFileName] = useState("");

  const bookID = book?.id;

  // Register category field for validation (without ref, since Radix Select doesn't support it)
  useEffect(() => {
    register("category", { required: "Категория книги обязательна" });
  }, [register]);

  const updateMutation = useMutation({
    mutationFn: ({ data, id }) => updateBook(data, id),
    onSuccess: () => {
      navigate("/");
      toast.success("Your book has been updated successfully!");
      console.log("Your book has been updated successfully!");
    },

    onError: (err) => {
      toast.error(err.message);
      console.log("Error updating book", err);
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => createBook(data),
    onSuccess: () => {
      toast.success("New book added successfully");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      navigate("/");
    },
  });

  function onSubmit(data) {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("content_type", contentType);

    // Add content based on content type
    if (contentType === "plaintext") {
      formData.append("content", data.content);
    } else if (contentType === "epub") {
      if (data.epub_file && data.epub_file[0]) {
        formData.append("epub_file", data.epub_file[0]);
      }
    }

    if (data.featured_image && data.featured_image[0]) {
      if (data.featured_image[0] != "/") {
        formData.append("featured_image", data.featured_image[0]);
      }
    }
    if (book && bookID) {
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

  if (isAuthenticated === false) {
    return <LoginPage />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`${
        book && "h-[90%] overflow-auto"
      }  md:px-16 px-8 py-6 flex flex-col mx-auto my-9 items-center gap-6 w-fit rounded-lg bg-[#FFFFFF] shadow-xl dark:text-white dark:bg-[#141624]`}
    >
      <div className="flex flex-col gap-2 justify-center items-center mb-2">
        <h3 className="font-semibold text-2xl max-sm:text-xl">
          {book ? "Обновить книгу" : "Создать книгу"}
        </h3>

        <p className="max-sm:text-[14px]">
          {book
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
        <Label htmlFor="description">Описание</Label>
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
          <Label htmlFor="epub_file">EPUB файл *</Label>
          <Input
            type="file"
            id="epub_file"
            accept=".epub"
            {...register("epub_file", {
              required: contentType === "epub" && !book ? "EPUB файл обязателен" : false,
            })}
            onChange={handleEpubFileChange}
            className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full max-sm:w-[300px] max-sm:text-[14px]"
          />
          {epubFileName && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Выбран файл: {epubFileName}
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
          defaultValue={book ? book.category : ""}
        >
          <SelectTrigger className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full max-sm:w-[300px] max-sm:text-[14px]">
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Categories</SelectLabel>
              <SelectItem value="Science Fiction">Science Fiction</SelectItem>
              <SelectItem value="Fantasy">Fantasy</SelectItem>
              <SelectItem value="Detective Fiction">Detective Fiction</SelectItem>
              <SelectItem value="Thriller">Thriller</SelectItem>
              <SelectItem value="Romance">Romance</SelectItem>
              <SelectItem value="Horror">Horror</SelectItem>
              <SelectItem value="Historical Fiction">Historical Fiction</SelectItem>
              <SelectItem value="Adventure">Adventure</SelectItem>                            
            </SelectGroup>
          </SelectContent>
        </Select>

        {errors?.category?.message && (
          <InputError error={errors.category.message} />
        )}
      </div>

      <div className="w-full">
        <Label htmlFor="featured_image">Featured Image *</Label>
        <Input
          type="file"
          id="picture"
          {...register("featured_image", {
            required: book ? false : "Book's featured image is required",
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full max-sm:w-[300px] max-sm:text-[14px]"
        />

        {errors?.featured_image?.message && (
          <InputError error={errors.featured_image.message} />
        )}
      </div>

      <div className="w-full flex items-center justify-center flex-col my-4">
        {book ? (
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

export default CreatePostPage;
