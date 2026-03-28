

import { SolidErrorStatePage } from "./SolidErrorStatePage";

export const NotFound = () => {
  return (
    <SolidErrorStatePage
      statusCode="404"
      title="Page not found"
      description="The page you're looking for does not exist."
      actionLabel="Back to home page"
      actionHref="/"
    />
  );
};
