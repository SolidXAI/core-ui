import React from "react";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;

};

export default function Image({ src, alt, ...rest }: any) {
  return <img src={src} alt={alt} {...rest} />;
}
