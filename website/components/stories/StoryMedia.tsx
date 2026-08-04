import Image from "next/image";

// Renders one story item (image or video) filling its parent — used for
// both the group cover thumbnail (StoryCard) and inside the full-screen
// viewer (StoryViewer). Video covers/items play muted with no controls so
// they read visually the same as a photo.
export default function StoryMedia({
  mediaType,
  mediaUrl,
  alt,
  sizes,
  className,
}: {
  mediaType: string;
  mediaUrl: string;
  alt: string;
  sizes: string;
  className: string;
}) {
  if (mediaType === "video") {
    return <video src={mediaUrl} muted autoPlay loop playsInline className={className} />;
  }
  return <Image src={mediaUrl} alt={alt} fill sizes={sizes} className={className} />;
}
