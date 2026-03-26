import { useRouter } from "../../hooks/useRouter";
import { AlertTriangle } from "lucide-react";
import { SolidErrorStatePage } from "./SolidErrorStatePage";

type SolidErrorPageProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
};

export const SolidErrorPage = ({
  title = "Something went wrong",
  message = "We hit an issue while loading this page. Please try again or go back to dashboard.",
  actionLabel = "Back to dashboard",
  actionHref = "/admin",
}: SolidErrorPageProps) => {
  const router = useRouter();

  return (
    <SolidErrorStatePage
      statusCode="500"
      icon={AlertTriangle}
      title={title}
      description={message}
      actionLabel={actionLabel}
      onAction={() => router.push(actionHref)}
    />
  );
};
