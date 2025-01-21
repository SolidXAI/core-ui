export const revalidateTag = async (tag: string) => {
  await fetch(
    `${process.env.API_URL}/api/revalidate?tag=${tag}&secret=${process.env.REVALIDATE_TOKEN}`,
    { method: "POST" }
  );
};
