import { getFallbackAvatar } from "@/lib/utils/avatar";

type AvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
};

export function Avatar({ name, src, className = "h-12 w-12" }: AvatarProps) {
  return (
    <img
      src={src || getFallbackAvatar(name)}
      alt={name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`${className} rounded-full object-cover ring-2 ring-white`}
    />
  );
}
