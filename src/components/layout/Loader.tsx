
import React from "react";

const Loader = () => {
  return (
    <div className="flex justify-center center-loader">
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default Loader;
