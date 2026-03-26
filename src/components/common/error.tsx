// Error components must be Client Components
import { AlertTriangle } from "lucide-react";
import { SolidErrorStatePage } from "./SolidErrorStatePage";

interface CustomError extends Error {
  errMessage: string;
}

export default function Error({
  error,
  reset,
}: {
  error: CustomError;
  reset?: () => void;
}) {
  return (
    <SolidErrorStatePage
      statusCode="500"
      icon={AlertTriangle}
      title="Something went wrong"
      description={error?.errMessage || "Sorry for the inconvenience."}
      actionLabel="Try again"
      onAction={() => reset?.()}
    />
  );
}
