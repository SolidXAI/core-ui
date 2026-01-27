import { env } from "../hooks/solid/env";

export const revalidateTag = async (tag: string) => {
  await fetch(
    `${env("API_URL")}/api/revalidate?tag=${tag}&secret=${env("REVALIDATE_TOKEN")}`,
    { method: "POST" }
  );
};
