import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkVideoSize = (bytes) => {
  const fileSizeInBytes = bytes;
  const fileSizeInGB = fileSizeInBytes / (1024 * 1024);

  if ((fileSizeInGB) => 500) {
    throw new ApiError(501, "video exceeds size limit of 500mb");
  }
};
