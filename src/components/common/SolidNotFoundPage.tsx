import { useRouter } from "../../hooks/useRouter";
import { SearchX } from "lucide-react";
import { SolidErrorStatePage } from "./SolidErrorStatePage";

type SolidNotFoundPageProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
};

export const SolidNotFoundPage = ({
  title = "Page not found",
  message = "The page you're looking for isn't available. Please go back to dashboard.",
  actionLabel = "Back to dashboard",
  actionHref = "/admin",
}: SolidNotFoundPageProps) => {
  const router = useRouter();

  return (
    <SolidErrorStatePage
      statusCode="404"
      icon={SearchX}
      title={title}
      description={message}
      actionLabel={actionLabel}
      onAction={() => router.push(actionHref)}
    />
  );
};
