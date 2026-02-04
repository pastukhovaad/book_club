import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateReadingGroup } from "@/services/apiBook";
import { toast } from "react-toastify";
import SmallSpinner from "./SmallSpinner";
import { resolveMediaUrl } from "@/api";

const EditReadingGroupForm = ({ reading_group, onClose }) => {
  const [formData, setFormData] = useState({
    name: reading_group.name || "",
    description: reading_group.description || "",
    featured_image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => updateReadingGroup(data, reading_group.id),
    onSuccess: () => {
      toast.success("Group was successfully updated!");
      queryClient.invalidateQueries({ queryKey: ["groups", reading_group.slug] });
      onClose();
    },
    onError: (err) => {
      console.log(err);
      toast.error(err.message || "Error updating group.");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        featured_image: file,
      }));
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    if (formData.featured_image) {
      data.append("featured_image", formData.featured_image);
    }

    mutation.mutate(data);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-[#181A2A] dark:text-[#FFFFFF] mb-6">
        Edit Reading Group
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        {/* Name Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="font-semibold text-[#181A2A] dark:text-[#FFFFFF]">
            Title
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-[#181A2A] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4B6BFB]"
            required
          />
        </div>

        {/* Description Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="font-semibold text-[#181A2A] dark:text-[#FFFFFF]">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={5}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-[#181A2A] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4B6BFB] resize-none"
          />
        </div>

        {/* Image Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="featured_image" className="font-semibold text-[#181A2A] dark:text-[#FFFFFF]">
            Featured Image
          </label>
          
          {/* Current Image or New Preview */}
          {imagePreview || reading_group.featured_image ? (
            <div className="w-full h-40 rounded-lg overflow-hidden mb-2">
              <img
                src={imagePreview || resolveMediaUrl(reading_group.featured_image)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-40 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
              <p className="text-gray-500 dark:text-gray-400">No image</p>
            </div>
          )}

          <input
            type="file"
            id="featured_image"
            name="featured_image"
            onChange={handleImageChange}
            accept="image/*"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-[#181A2A] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4B6BFB]"
          />
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
            Leave empty to keep current image
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-[#181A2A] dark:text-[#FFFFFF] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-[#4B6BFB] text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending && <SmallSpinner />}
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditReadingGroupForm;
