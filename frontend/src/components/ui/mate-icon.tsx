import Image from "next/image";

import { cn } from "@/lib/utils/format";

export function MateIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/icons/mate-apple.png"
      alt="Mate"
      width={size}
      height={size}
      className={cn("inline-block", className)}
      priority={false}
    />
  );
}
