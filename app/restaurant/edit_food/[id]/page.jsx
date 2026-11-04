"use client";
import { useForm } from "react-hook-form";
import { useParams, useRouter } from 'next/navigation'
import { toast } from "react-toastify";
import ValidationError from "@/app/_components/ValidationError";
import { useEffect, useRef, useState } from "react";
import withAuth from "@/app/hoc/withAuth";
import FoodImageUpload from "@/app/_components/restaurant/food/FoodImageUpload";
const EditFood = () => {
  const params = useParams();
  const {
    handleSubmit,
    watch,
    setValue,
    register,
    trigger,
    formState: { errors },
  } = useForm();
  const router = useRouter();
  const [isDisabled, setIsDisabled] = useState(false);
  const [uploadedImage, setUploadedImage] = useState("");
  const uploadedImageRef = useRef("");
  const imageField = register("image", {
    validate: (value) => uploadedImageRef.current || value?.trim() || "Upload a photo or provide an image URL."
  });
  const [isLoading, setIsLoading] = useState(true);
  const _id = params.id;
  const getFoodItem = async () => {
    try {
      const response = await fetch(`/api/v1/restaurant/food/${_id}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.message || "Unable to load this food item.");
        return;
      }
      setValue("name", result.data.name);
      setValue("price", result.data.price);
      if (result.data.image?.startsWith("data:image/")) {
        uploadedImageRef.current = result.data.image;
        setUploadedImage(result.data.image);
        setValue("image", "");
      } else {
        setValue("image", result.data.image || "");
      }
    } catch (error) {
      console.error("Food item loading failed:", error);
      toast.error("Unable to load this food item.");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    if (_id) getFoodItem();
  }, [_id]);

  const submitFormHandler = async (data) => {
    setIsDisabled(true);
    try {
      data.image = uploadedImage || data.image;
      const response = await fetch(`/api/v1/restaurant/food/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.message || "Unable to update this food item.");
        return;
      }
      toast.success(result.message);
      router.push('/restaurant/dashboard');
    } catch (error) {
      console.error("Food item update failed:", error);
      toast.error("Unable to update this food item.");
    } finally {
      setIsDisabled(false);
    }
  }

  return (
    <div align="center">
      <h2 className="font-bold">Edit Food Item</h2>
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
            <textarea
              id="image"
              className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1"
              placeholder="Paste an image URL (optional if you upload)"
              {...imageField}
              onChange={(event) => {
                uploadedImageRef.current = "";
                setUploadedImage("");
                imageField.onChange(event);
              }}
            />
            {errors.image && <ValidationError message={errors.image.message} />}
          </div>
          <FoodImageUpload
            image={uploadedImage || watch("image")}
            onImageChange={(image) => {
              uploadedImageRef.current = image;
              setUploadedImage(image);
              trigger("image");
            }}
          />
          <div className="flex items-center justify-between">
            <button
              disabled={isDisabled}
              className={`bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              type="submit">
              {isLoading ? "Loading…" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default withAuth(EditFood)