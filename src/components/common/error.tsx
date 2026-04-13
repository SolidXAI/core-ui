// Error components must be Client Components
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
      title="Something went wrong"
      description={error?.errMessage || "Sorry for the inconvenience."}
      actionLabel="Try again"
      onAction={() => reset?.()}
    />
  );
}
