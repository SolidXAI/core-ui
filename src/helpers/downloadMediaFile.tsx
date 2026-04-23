import { ERROR_MESSAGES } from "../constants/error-messages";
import { env } from "../adapters/env";

export const downloadMediaFile = (fileUrl: string, fileName?: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
