"use client";

import { CldUploadWidget } from "next-cloudinary";
import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string, publicId?: string) => void;
  onRemove: () => void;
  value: string | null;
  folder?: string;
}

export function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value,
  folder = "mamas"
}: ImageUploadProps) {

  // Restore scroll whenever the Cloudinary widget iframe is removed from the DOM
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const iframe = document.querySelector("iframe[src*='cloudinary']");
      if (!iframe && document.body.style.overflow === "hidden") {
        document.body.style.overflow = "";
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const onUpload = useCallback((result: any) => {
    if (result.event === "success") {
      onChange(result.info.secure_url, result.info.public_id);
      // Restore scroll after successful upload
      setTimeout(() => {
        document.body.style.overflow = "";
      }, 300);
    }
  }, [onChange]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {value && (
          <div className="relative w-[200px] h-[200px] rounded-md overflow-hidden">
            <div className="absolute z-10 top-2 right-2">
              <Button
                type="button"
                onClick={onRemove}
                variant="destructive"
                size="icon"
                className="h-8 w-8"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover"
              alt="Image"
              src={value}
            />
          </div>
        )}
      </div>
      {!value && (
        <CldUploadWidget 
          onSuccess={onUpload}
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"} 
          options={{
            folder: folder,
            maxFiles: 1,
            sources: ["local", "url", "camera", "instagram"],
            resourceType: "image",
            showPoweredBy: false,
            clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
          }}
        >
          {({ open }) => {
            const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              open();
            };

            return (
              <Button
                type="button"
                disabled={disabled}
                variant="secondary"
                onClick={onClick}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Subir Imagen
              </Button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
}

