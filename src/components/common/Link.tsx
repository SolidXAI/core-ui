import { Link } from "react-router-dom";
import React from "react";
import { preserveModelMenuContext } from "../../helpers/modelViewPersistence";

// Wrapper for Link to allow easy migration from Next.js to React Router
export const SolidLink: React.FC<any> = ({ href, children, ...props }) => {
  return (
    <Link to={preserveModelMenuContext(href)} {...props}>
      {children}
    </Link>
  );
};

export default SolidLink;
