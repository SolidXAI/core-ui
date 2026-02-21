export type FetchS3UrlOptions = {
    s3Key: string;
    fileType?: string;
    bucketName?: string;
    mediaStorageProviderUserKey?: string;
    isPrivate?: string | boolean;
};

type ResolveS3UrlResponse = {
    statusCode?: number | string;
    data?: {
        url?: string;
    };
};

type ResolveS3UrlMutation = (data: FetchS3UrlOptions) => {
    unwrap: () => Promise<ResolveS3UrlResponse>;
};

export const fetchS3Url = async (resolveS3Url: ResolveS3UrlMutation,options: FetchS3UrlOptions): Promise<string | null> => {
    try {
        const result = await resolveS3Url(options).unwrap();
        const isSuccess = result?.statusCode === 200 || result?.statusCode === "200";

        if (isSuccess) {
            return result?.data?.url ?? null;
        }
    } catch (error) {
        console.error("Failed to resolve S3 URL:", error);
    }

    return null;
};
