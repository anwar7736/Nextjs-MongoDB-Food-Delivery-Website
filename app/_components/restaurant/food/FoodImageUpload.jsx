"use client";

import { toast } from "react-toastify";
import ImageWithFallback from "../../ImageWithFallback";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_STORED_IMAGE_LENGTH = 600_000;
const IMAGE_DIMENSIONS = [1200, 1000, 800, 640, 480];
const IMAGE_QUALITIES = [0.78, 0.66, 0.54, 0.42];

export default function FoodImageUpload({ image, onImageChange, isProcessing, onProcessingChange }) {
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

    const fileInput = event.target;
    onProcessingChange(true);
    const reader = new FileReader();
    const failProcessing = (message) => {
      toast.error(message);
      onProcessingChange(false);
      fileInput.value = "";
    };
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        failProcessing("Unable to read this image.");
        return;
      }

      const sourceImage = new Image();
      sourceImage.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) {
            failProcessing("Unable to process this image.");
            return;
          }

          for (const maxDimension of IMAGE_DIMENSIONS) {
            const scale = Math.min(1, maxDimension / Math.max(sourceImage.width, sourceImage.height));
            canvas.width = Math.round(sourceImage.width * scale);
            canvas.height = Math.round(sourceImage.height * scale);
            context.fillStyle = "#fff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

            for (const quality of IMAGE_QUALITIES) {
              const optimizedImage = canvas.toDataURL("image/jpeg", quality);
              if (optimizedImage.length <= MAX_STORED_IMAGE_LENGTH) {
                onImageChange(optimizedImage);
                onProcessingChange(false);
                fileInput.value = "";
                return;
              }
            }
          }
          failProcessing("This photo could not be optimized enough. Choose a smaller image.");
        } catch (error) {
          console.error("Food image optimization failed:", error);
          failProcessing("Unable to process this image.");
        }
      };
      sourceImage.onerror = () => failProcessing("Unable to process this image.");
      sourceImage.src = reader.result;
    };
    reader.onerror = () => failProcessing("Unable to read this image.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="food-image-upload">
      <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="food-image-file">
        Upload a photo <span>(optional; max 8 MB, optimized automatically)</span>
      </label>
      <input
        id="food-image-file"
        className="food-image-file"
        type="file"
        accept="image/*"
        onChange={uploadImage}
        disabled={isProcessing}
      />
      {isProcessing && <p className="food-image-status" role="status">Optimizing photo…</p>}
      <div className="food-image-preview-wrap">
        <ImageWithFallback className="food-image-preview" src={image} alt="Food item preview" />
        <p>{image ? "Photo ready to save" : "No photo selected; adding a photo is optional."}</p>
      </div>
    </div>
  );
}
