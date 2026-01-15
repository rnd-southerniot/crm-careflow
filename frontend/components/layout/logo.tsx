import Link from "next/link";

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <Link href="/">
      <img
        src="/hrms-logo.png"
        className={` ${className} dark:block" alt="shadcn ui kit light logo hidden w-6`}
        alt="shadcn ui kit logo"
      />
      <img
        src="/hrms-logo.png"
        className={`${className} block w-6 dark:hidden`}
        alt="shadcn ui kit logo"
      />
    </Link>
  );
}
