import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { registerUser, updateProfile } from "@/services/apiBook";
import InputError from "@/ui_components/InputError";
import SmallSpinner from "@/ui_components/SmallSpinner";
import SmallSpinnerText from "@/ui_components/SmallSpinnerText";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useState } from "react";
import { BASE_URL } from "@/api";

const SignupPage = ({ userInfo, updateForm, toggleModal }) => {

  const queryClient = useQueryClient()

  const [imagePreview, setImagePreview] = useState(null);

  const { register, handleSubmit, formState, reset, watch, control } = useForm({defaultValues: userInfo ? userInfo : {}});
  const { errors } = formState;

  const password = watch("password");

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

  const updateProfileMutation = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: () => {
      toast.success("Profile updated successfully!")
      toggleModal()
      queryClient.invalidateQueries({queryKey: ["users", userInfo?.username]})
    },

    onError: (err) => {
      toast.error(err.message)
    }
  })

  const mutation = useMutation({
    mutationFn: (data) => registerUser(data),
    onSuccess: () => {
      toast.success("You have successfully created an account!");
      reset();
    },

    onError: (err) => {
      toast.error(err.message);
    },
  });

  function onSubmit(data) {
    if(updateForm){
      const formData = new FormData()
      formData.append("username", data.username || "")
      formData.append("first_name", data.first_name || "")
      formData.append("last_name", data.last_name || "")
      formData.append("job_title", data.job_title || "")
      formData.append("bio", data.bio || "")

      // Добавляем новое изображение только если оно выбрано
      if(data.profile_picture && Array.isArray(data.profile_picture) && data.profile_picture.length > 0){
        formData.append("profile_picture", data.profile_picture[0])
      }

      updateProfileMutation.mutate(formData)


    }

    else{
      mutation.mutate(data)
    }
    
  }

  return (
    <form
      className={`${
        updateForm && "h-[90%] overflow-auto"
      } md:px-16 px-8 py-6 flex flex-col mx-auto my-9 items-center gap-4 w-fit 
    rounded-lg bg-[#FFFFFF] shadow-xl dark:text-white dark:bg-[#141624]`}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2 justify-center items-center mb-2">
        <h3 className="font-semibold text-2xl">
          {updateForm ? "Update Profile Form" : "SignUp Form"}
        </h3>
        <p>
          {updateForm
            ? "You can tell us more about you."
            : "Create your account to get started!"}
        </p>
      </div>

      <div>
        <Label htmlFor="username" className="dark:text-[97989F]">
          Username
        </Label>
        <Input
          type="text"
          id="username"
          placeholder="Enter username"
          {...register("username", {
            required: "Username is required",
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-[300px]"
        />
        {errors?.username?.message && (
          <InputError error={errors.username.message} />
        )}
      </div>

      <div className="w-[300px]">
        <Label htmlFor="first_name">First Name</Label>
        <Input
          type="text"
          id="first_name"
          placeholder="Enter first name"
          {...register("first_name", {
            required: "Firstname is required",
            minLength: {
              value: 3,
              message: "Firstname must be at least 3 characters",
            },
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full"
        />
        {errors?.first_name?.message && (
          <InputError error={errors.first_name.message} />
        )}
      </div>

      <div className="w-[300px]">
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          type="text"
          id="last_name"
          placeholder="Enter last name"
          {...register("last_name", {
            required: "Lastname is required",
            minLength: {
              value: 3,
              message: "Lastname must be at least 3 characters",
            },
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full"
        />
        {errors?.last_name?.message && (
          <InputError error={errors.last_name.message} />
        )}
      </div>

        {updateForm && <div className="w-[300px]">
        <Label htmlFor="job_title" className="dark:text-[97989F]">
          Job Title
        </Label>
        <Input
          type="text"
          id="job_title"
          placeholder="Enter Job Title"
          {...register("job_title", {
            required: "Your job title is required",
            minLength: {
              value: 3,
              message: "Your job title must be at least 3 characters",
            },
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full"
        />
        {errors?.job_title?.message && (
          <InputError error={errors.job_title.message} />
        )}
      </div>}


      {updateForm && <div className="w-[300px]">
        <Label htmlFor="content">Bio</Label>
        <Textarea
          id="content"
          placeholder="Tell us more about you"
          {...register("bio", {
            required: "Your bio is required",
            minLength: {
              value: 10,
              message: "The content must be at least 10 characters",
            },
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[60px] w-full text-justify"
        />
        {errors?.bio?.message && (
          <InputError error={errors.bio.message} />
        )}
      </div>}

      {updateForm && <div className="w-[300px]">
        <Label htmlFor="profile_picture">Profile Picture</Label>
        
        {/* Отображение текущего изображения */}
        {!imagePreview && userInfo?.profile_picture && (
          <div className="mb-3">
            <img 
              src={`${BASE_URL}${userInfo.profile_picture}`} 
              alt="Current profile" 
              className="h-40 w-40 rounded-lg object-cover border-2 border-[#141624] dark:border-[#3B3C4A]"
            />
            <p className="text-[12px] text-gray-500 mt-2">Current Image</p>
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
            <p className="text-[12px] text-blue-500 mt-2">New preview</p>
          </div>
        )}

        <Input
          type="file"
          id="picture"
          accept="image/*"
          {...register("profile_picture", {
            required: false,
          })}
          onChange={(e) => {
            handleImageChange(e);
          }}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-full text-[14px]"
        />
        
        <p className="text-[12px] text-gray-500 mt-2">
          Leave empty to keep current image
        </p>
      </div>}


      {updateForm || <div>
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          id="password"
          placeholder="Enter password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-[300px]"
        />
        {errors?.password?.message && (
          <InputError error={errors.password.message} />
        )}
      </div>}

     {updateForm ||  <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          type="password"
          id="confirmPassword"
          placeholder="Confirm password"
          {...register("confirmPassword", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
            validate: (value) => value === password || "Passwords do not match",
          })}
          className="border-2 border-[#141624] dark:border-[#3B3C4A] focus:outline-0 h-[40px] w-[300px]"
        />
        {errors?.confirmPassword?.message && (
          <InputError error={errors.confirmPassword.message} />
        )}
      </div>}

      <div className="w-[300px] flex items-center justify-center flex-col my-4">
        {updateForm ? (
          <button className="bg-[#4B6BFB] text-white w-full py-3 px-2 rounded-md flex items-center justify-center gap-2">
            {updateProfileMutation.isPending ? (
              <>
                <SmallSpinner />
                <SmallSpinnerText text="Updating user..." />
              </>
            ) : (
              <SmallSpinnerText text="Update user profile" />
            )}
          </button>
        ) : (
          <button className="bg-[#4B6BFB] text-white w-full py-3 px-2 rounded-md flex items-center justify-center gap-2">
            {mutation.isPending ? (
              <>
                <SmallSpinner />
                <SmallSpinnerText text="Creating user..." />
              </>
            ) : (
              <SmallSpinnerText text="Signup" />
            )}
          </button>
        )}
       {updateForm || <p className="text-[14px]">
          Already have an account? <Link to="/signin">Sign In</Link>
        </p>}
      </div>
    </form>
  );
};

export default SignupPage;
