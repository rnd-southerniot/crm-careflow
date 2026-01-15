import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyLogo } from "./CompanyLogo";

interface CompanyAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DynamicAvatar({
  name,
  imageUrl,
  size = "md",
  className = ""
}: CompanyAvatarProps) {
  // Determine avatar size
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const svgSize = {
    sm: 32,
    md: 40,
    lg: 48
  };

  const avatarSize = sizeMap[size];

  return (
    <Avatar className={`${avatarSize} ${className}`}>
      {imageUrl ? <AvatarImage src={imageUrl || "/placeholder.svg"} alt={name} /> : null}
      <AvatarFallback className="p-0">
        <CompanyLogo name={name} size={svgSize[size]} />
      </AvatarFallback>
    </Avatar>
  );
}
