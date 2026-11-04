"use client";

import { toast } from "react-toastify";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_STORED_IMAGE_LENGTH = 600_000;

export default function FoodImageUpload({ image, onImageChange }) {
  const uploadImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Choose an image smaller than 8 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Unable to read this image.");
        return;
      }

      const sourceImage = new Image();
      sourceImage.onload = () => {
        const maxDimension = 1200;
        const scale = Math.min(1, maxDimension / Math.max(sourceImage.width, sourceImage.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sourceImage.width * scale);
        canvas.height = Math.round(sourceImage.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          toast.error("Unable to process this image.");
          return;
        }
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
        const optimizedImage = canvas.toDataURL("image/jpeg", 0.78);
        if (optimizedImage.length > MAX_STORED_IMAGE_LENGTH) {
          toast.error("This photo is still too large after optimization. Choose a smaller image.");
          return;
        }
        onImageChange(optimizedImage);
      };
      sourceImage.onerror = () => toast.error("Unable to process this image.");
      sourceImage.src = reader.result;
    };
    reader.onerror = () => toast.error("Unable to read this image.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="food-image-upload">
      <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="food-image-file">
        Or upload a photo (max 8 MB; optimized automatically)
      </label>
      <input
        id="food-image-file"
        className="food-image-file"
        type="file"
        accept="image/*"
        onChange={uploadImage}
      />
      {image && (
        <img className="food-image-preview" src={image} alt="Food item preview" />
      )}
    </div>
  );
}
