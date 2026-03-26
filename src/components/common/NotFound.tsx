

import { SearchX } from "lucide-react";
import { SolidErrorStatePage } from "./SolidErrorStatePage";

export const NotFound = () => {
  return (
    <SolidErrorStatePage
      statusCode="404"
      icon={SearchX}
      title="Page not found"
      description="The page you're looking for does not exist."
      actionLabel="Back to home page"
      actionHref="/"
    />
  );
};
