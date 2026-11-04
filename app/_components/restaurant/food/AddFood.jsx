import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ValidationError from "../../ValidationError";
import { restaurant_auth } from "@/app/helpers/helper";
import { useRef, useState } from "react";
import FoodImageUpload from "./FoodImageUpload";
const AddFood = (props) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm();
  const uploadedImageRef = useRef("");
  const imageField = register("image", {
    validate: (value) => uploadedImageRef.current || value?.trim() || "Upload a photo or provide an image URL."
  });

  const submitFormHandler = async (data) => {
    if (isImageProcessing) {
      toast.info("Wait for the photo to finish optimizing.");
      return;
    }
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
    <main className="food-editor">
      <h2>Add New Food Item</h2>
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
          <div className="food-form-field">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="image">Image URL <span className="food-form-optional">(optional)</span></label>
            <textarea
              id="image"
              className="food-form-control food-image-url"
              placeholder="https://example.com/food.jpg"
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
            isProcessing={isImageProcessing}
            onProcessingChange={setIsImageProcessing}
            onImageChange={(image) => {
              uploadedImageRef.current = image;
              setUploadedImage(image);
              trigger("image");
            }}
          />
          <div className="food-form-actions">
            <button
              disabled={isDisabled || isImageProcessing}
              className={`bg-purple-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              type="submit">
              {isDisabled ? "Saving…" : "Add food item"}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default AddFood