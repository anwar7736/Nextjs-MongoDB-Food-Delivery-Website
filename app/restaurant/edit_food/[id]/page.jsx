"use client";
import { useForm } from "react-hook-form";
import { useParams, useRouter } from 'next/navigation'
import { toast } from "react-toastify";
import ValidationError from "@/app/_components/ValidationError";
import { useEffect, useState } from "react";
import withAuth from "@/app/hoc/withAuth";
import FoodImageUpload from "@/app/_components/restaurant/food/FoodImageUpload";
const EditFood = () => {
  const params = useParams();
  const {
    handleSubmit,
    setValue,
    register,
    formState: { errors },
  } = useForm();
  const router = useRouter();
  const [isDisabled, setIsDisabled] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState("");
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
      setUploadedImage(result.data.image || "");
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
    if (isImageProcessing) {
      toast.info("Wait for the photo to finish optimizing.");
      return;
    }
    setIsDisabled(true);
    try {
      data.image = uploadedImage;
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
    <main className="food-editor">
      <h2>Edit Food Item</h2>
      <div className="food-editor-content">
        <form className="food-form-card" onSubmit={handleSubmit(submitFormHandler)}>
          <div className="food-form-field">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
              Name
            </label>
            <input className="food-form-control" id="name" type="text" placeholder="e.g. Chicken Burger" {...register("name", {
              required: 'This field is required.', minLength: {
                value: 3,
                message: "This should be atleast 3 characters."
              }
            })} />
            {errors.name && <ValidationError message={errors.name.message} />}
          </div>
          <div className="food-form-field">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="price">
              Price
            </label>
            <input className="food-form-control" id="price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" {...register("price", { required: 'This field is required.', min: { value: 0, message: "Price cannot be negative." } })} />
            {errors.price && <ValidationError message={errors.price.message} />}
          </div>
          <FoodImageUpload
            image={uploadedImage}
            isProcessing={isImageProcessing}
            onProcessingChange={setIsImageProcessing}
            onImageChange={setUploadedImage}
          />
          <div className="food-form-actions">
            <button
              disabled={isDisabled || isImageProcessing || isLoading}
              className={`bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              type="submit">
              {isLoading ? "Loading…" : isDisabled ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default withAuth(EditFood)