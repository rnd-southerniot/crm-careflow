import { Spinner } from "./Spinner";

interface LoadingOverlayProps {
  loaderText?: string;
  isLoading: boolean;
  spinnerSize?: number;
}

export function LoadingOverlay({
  loaderText = "Loading",
  isLoading,
  spinnerSize = 40
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-[3px]">
      <div className="flex flex-col items-center gap-2">
        <Spinner size={spinnerSize} />
        <p className="text-muted-foreground text-sm">{loaderText}...</p>
      </div>
    </div>
  );
}
