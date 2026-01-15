"use client"

import { LockIcon, AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface PermissionDeniedProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
  backText?: string;
  contactEmail?: string;
  contactText?: string;
}

export function PermissionDenied({
  title = "Access Denied",
  description = "You don't have permission to view this content.",
  showBackButton = true,
  backHref = "/",
  backText = "Go back",
  contactEmail,
  contactText = "Contact administrator"
}: PermissionDeniedProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="mx-auto max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <LockIcon className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertCircleIcon className="h-5 w-5" aria-hidden="true" />
            <p className="text-sm">
              If you believe this is an error, please contact your administrator for assistance.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          {/* {showBackButton && (
            <Button variant="outline" className="w-full" asChild>
              <Link href={backHref}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                {backText}
              </Link>
            </Button>
          )} */}
          {/* {contactEmail && (
            <Button className="w-full" asChild>
              <a href={`mailto:${contactEmail}`}>{contactText}</a>
            </Button>
          )} */}
        </CardFooter>
      </Card>
    </div>
  );
}
