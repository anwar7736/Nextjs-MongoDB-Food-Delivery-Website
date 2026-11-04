"use client";

const PLACEHOLDER_IMAGE = "/image-placeholder.svg";

export default function ImageWithFallback({ src, alt, ...props }) {
  const imageSource = typeof src === "string" && src.trim() ? src : PLACEHOLDER_IMAGE;

  return (
    <img
      {...props}
      src={imageSource}
      alt={alt || ""}
      onError={(event) => {
        if (!event.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) {
          event.currentTarget.src = PLACEHOLDER_IMAGE;
        }
      }}
    />
  );
}
