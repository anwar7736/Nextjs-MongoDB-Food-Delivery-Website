import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ValidationError from "../../ValidationError";
import { restaurant_auth } from "@/app/helpers/helper";
import { useState } from "react";
import FoodImageUpload from "./FoodImageUpload";
const AddFood = (props) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [uploadedImage, setUploadedImage] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const submitFormHandler = async (data) => {
    setIsDisabled(true);
    try {
      const restaurant = await restaurant_auth();
      data.restaurant_id = restaurant._id;
      data.image = uploadedImage || data.image;

      const response = await fetch("/api/v1/restaurant/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.message || "Unable to add this food item.");
        return;
      }

      props.setStatus(1);
      toast.success(result.message);
    } catch (error) {
      console.error("Food item creation failed:", error);
      toast.error("Unable to add this food item.");
    } finally {
      setIsDisabled(false);
    }
  }

  return (
    <div align="center">
      <h2 className="font-bold">Add New Food Item</h2>
      <div className="w-full max-w-xs">
        <form className="food-form-card" onSubmit={handleSubmit(submitFormHandler)}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
              Name
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="name" type="text" placeholder="Name" {...register("name", {
              required: 'This field is required.', minLength: {
                value: 3,
                message: "This should be atleast 3 characters."
              }
            })} />
            {errors.name && <ValidationError message={errors.name.message} />}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="price">
              Price
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="price" type="number" placeholder="Price" {...register("price", { required: 'This field is required.' })} />
            {errors.price && <ValidationError message={errors.price.message} />}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="image">
              Image Link
            </label>
            <textarea name="image" id="image" className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" placeholder="Paste an image URL (optional if you upload)" {...register("image", {
              validate: (value) => value?.trim() || "Upload a photo or provide an image URL."
            })}></textarea>
            {errors.image && <ValidationError message={errors.image.message} />}
          </div>
          <FoodImageUpload
            image={uploadedImage || watch("image")}
            onImageChange={(image) => {
              setUploadedImage(image);
              setValue("image", image, { shouldDirty: true, shouldValidate: true });
            }}
          />
          <div className="flex items-center justify-between">
            <button
              disabled={isDisabled}
              className={`bg-purple-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              type="submit">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddFood