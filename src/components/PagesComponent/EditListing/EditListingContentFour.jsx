"use client";
import { placeholderImage, t } from "@/utils";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { MdClose } from "react-icons/md";
import { MdInfoOutline } from "react-icons/md";
import { HiOutlineUpload } from "react-icons/hi";
import toast from "@/utils/toast";
import { useSelector } from "react-redux";
import { settingsData } from "@/redux/reuducer/settingSlice";

const ContentFour = ({
  uploadedImages,
  setUploadedImages,
  OtherImages,
  setOtherImages,
  handleImageSubmit,
  handleGoBack,
  setDeleteImagesId,
}) => {
  const systemSettingsData = useSelector(settingsData);
  const placeholderImageUrl = systemSettingsData?.data?.placeholder_image || "";
  // Store object URLs for cleanup
  const objectUrlsRef = useRef([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // Cleanup main images
      objectUrlsRef.current.forEach(url => {
        if (url && typeof url === 'string') URL.revokeObjectURL(url);
      });
      objectUrlsRef.current = [];
      
      // Cleanup other images
      if (objectUrlsRef.current.otherUrls) {
        objectUrlsRef.current.otherUrls.forEach(url => {
          if (url && typeof url === 'string') URL.revokeObjectURL(url);
        });
      }
    };
  }, []);

  // Enhanced function to create a stable file copy with retry and timeout
  const createStableFile = useCallback((file, retries = 3) => {
    return new Promise((resolve, reject) => {
      // Validate file first
      if (!file || !(file instanceof File)) {
        reject(new Error('Invalid file object'));
        return;
      }

      // Check file size (max 10MB as safety)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        reject(new Error('File too large'));
        return;
      }

      let attemptCount = 0;
      const attemptRead = () => {
        attemptCount++;
        const reader = new FileReader();
        let timeoutId;

        // Set timeout for file reading (30 seconds)
        timeoutId = setTimeout(() => {
          reader.abort();
          if (attemptCount < retries) {
            attemptRead(); // Retry
          } else {
            reject(new Error('File read timeout'));
          }
        }, 30000);

        reader.onload = (e) => {
          clearTimeout(timeoutId);
          try {
            // Validate the result
            if (!e.target.result) {
              throw new Error('Empty file data');
            }

            // Create a new File object from the ArrayBuffer to ensure it's stable
            const blob = new Blob([e.target.result], { type: file.type });
            
            // Validate blob was created
            if (!blob || blob.size === 0) {
              throw new Error('Invalid blob created');
            }

            const newFile = new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified || Date.now(),
            });

            // Verify the new file is valid
            if (!newFile || newFile.size === 0) {
              throw new Error('Invalid file created');
            }

            resolve(newFile);
          } catch (error) {
            clearTimeout(timeoutId);
            if (attemptCount < retries) {
              // Retry on error
              setTimeout(() => attemptRead(), 100);
            } else {
              reject(error);
            }
          }
        };

        reader.onerror = () => {
          clearTimeout(timeoutId);
          if (attemptCount < retries) {
            // Retry on error
            setTimeout(() => attemptRead(), 100);
          } else {
            reject(new Error('Failed to read file after retries'));
          }
        };

        reader.onabort = () => {
          clearTimeout(timeoutId);
          if (attemptCount < retries) {
            attemptRead(); // Retry
          } else {
            reject(new Error('File read aborted'));
          }
        };

        // Read file as ArrayBuffer
        try {
          reader.readAsArrayBuffer(file);
        } catch (error) {
          clearTimeout(timeoutId);
          if (attemptCount < retries) {
            setTimeout(() => attemptRead(), 100);
          } else {
            reject(error);
          }
        }
      };

      attemptRead();
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length == 0) {
      toast.error(t("wrongFile"));
      return;
    }
    
    try {
      // Create stable file copies immediately to prevent ERR_UPLOAD_FILE_CHANGED
      const stableFiles = await Promise.all(
        acceptedFiles.map(file => createStableFile(file))
      );
      setUploadedImages(stableFiles);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(t("wrongFile") || "Failed to process image");
      // Set placeholder image so user can continue even if upload failed
      if (placeholderImageUrl) {
        setUploadedImages([placeholderImageUrl]);
      }
    }
  }, [createStableFile, setUploadedImages, placeholderImageUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    multiple: false,
  });

  const removeImage = (index) => {
    // Revoke object URL when removing image (only if it exists and is not a placeholder string)
    if (objectUrlsRef.current[index] && typeof objectUrlsRef.current[index] === 'string') {
      URL.revokeObjectURL(objectUrlsRef.current[index]);
      objectUrlsRef.current[index] = null;
    }
    
    if (typeof uploadedImages === "string") {
      setUploadedImages([]);
    } else {
      setUploadedImages((prevImages) => {
        const newImages = prevImages?.filter((_, i) => i !== index);
        // Clean up object URLs array
        objectUrlsRef.current = objectUrlsRef.current.filter((_, i) => i !== index);
        return newImages;
      });
    }
  };

  const files = useMemo(() => {
    if (typeof uploadedImages === "string") {
      // Existing image from server (string URL)
      return (
        <div className="dropbox_img_div">
          <img
            className="dropbox_img"
            loading="lazy"
            src={uploadedImages}
            alt="Uploaded Image"
            onError={(e) => {
              console.error('Image load error:', e);
              // Fallback: use placeholder image
              e.target.src = placeholderImage;
            }}
          />
          <div className="dropbox_d">
            <button
              className="close_icon_cont img_upl_close"
              onClick={() => removeImage(0)}
            >
              <MdClose size={14} color="black" className="upd_img_rem_icon" />
            </button>
            <div className="dropbox_img_deatils">
              <span>{t("uploadedImage")}</span>
            </div>
          </div>
        </div>
      );
    } else {
      // New uploaded files (File objects) or placeholder from failed upload
      if (!uploadedImages || uploadedImages.length === 0) return null;
      
      // Check if first item is placeholderImage (string URL from failed upload)
      if (uploadedImages.length === 1 && typeof uploadedImages[0] === 'string' && uploadedImages[0] === placeholderImageUrl) {
        return (
          <div className="dropbox_img_div">
            <img
              className="dropbox_img"
              loading="lazy"
              src={placeholderImageUrl}
              alt="Placeholder Image"
            />
            <div className="dropbox_d">
              <button
                className="close_icon_cont img_upl_close"
                onClick={() => removeImage(0)}
              >
                <MdClose size={14} color="black" className="upd_img_rem_icon" />
              </button>
              <div className="dropbox_img_deatils">
                <span>{t("uploadedImage")}</span>
              </div>
            </div>
          </div>
        );
      }
      
      // Clean up old object URLs
      objectUrlsRef.current.forEach(url => {
        if (url && typeof url === 'string') URL.revokeObjectURL(url);
      });
      objectUrlsRef.current = [];

      return uploadedImages.map((file, index) => {
        // Skip if it's a string (shouldn't happen here, but safety check)
        if (typeof file === 'string') {
          return (
            <div key={index} className="dropbox_img_div">
              <img
                className="dropbox_img"
                src={file}
                alt="Uploaded Image"
                onError={(e) => {
                  console.error('Image load error:', e);
                  e.target.src = placeholderImage;
                }}
              />
              <div className="dropbox_d">
                <button
                  className="close_icon_cont img_upl_close"
                  onClick={() => removeImage(index)}
                >
                  <MdClose size={14} color="black" className="upd_img_rem_icon" />
                </button>
                <div className="dropbox_img_deatils">
                  <span>{t("uploadedImage")}</span>
                </div>
              </div>
            </div>
          );
        }

        // Create object URL and store it
        let objectUrl;
        try {
          objectUrl = URL.createObjectURL(file);
          objectUrlsRef.current[index] = objectUrl;
        } catch (error) {
          console.error('Error creating object URL:', error);
          return null;
        }

        return (
          <div key={index} className="dropbox_img_div">
            <img
              className="dropbox_img"
              loading="lazy"
              src={objectUrl}
              alt={file.name}
              onError={(e) => {
                console.error('Image load error:', e);
                // Fallback: try to recreate the URL first
                try {
                  if (objectUrlsRef.current[index]) {
                    URL.revokeObjectURL(objectUrlsRef.current[index]);
                  }
                  const newUrl = URL.createObjectURL(file);
                  objectUrlsRef.current[index] = newUrl;
                  e.target.src = newUrl;
                } catch (error) {
                  console.error('Error recreating object URL:', error);
                  // Final fallback: use placeholder image
                  e.target.src = placeholderImage;
                }
              }}
            />
            <div className="dropbox_d">
              <button
                className="close_icon_cont img_upl_close"
                onClick={() => removeImage(index)}
              >
                <MdClose size={14} color="black" className="upd_img_rem_icon" />
              </button>
              <div className="dropbox_img_deatils">
                <span>{file.name}</span>
                <span>{Math.round(file.size / 1024)} KB</span>
              </div>
            </div>
          </div>
        );
      }).filter(Boolean); // Remove any null entries
    }
  }, [uploadedImages, placeholderImageUrl, t]);

  const onOtherDrop = useCallback(
    async (acceptedFiles) => {
      const currentFilesCount = OtherImages.length;
      const remainingSlots = 10 - currentFilesCount;

      if (remainingSlots === 0) {
        toast.error(t("imageLimitExceeded"));
        return;
      }

      // Limit to remaining slots
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      if (acceptedFiles.length > remainingSlots) {
        toast.error(
          t("youCanUpload") + " " + remainingSlots + " " + t("moreImages")
        );
      }

      // Use Promise.allSettled to continue processing even if some fail
      const results = await Promise.allSettled(
        filesToProcess.map(file => createStableFile(file))
      );

      // Separate successful and failed files
      const successfulFiles = [];
      const failedFiles = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulFiles.push(result.value);
        } else {
          failedFiles.push(filesToProcess[index]);
          console.error(`Failed to process file ${filesToProcess[index].name}:`, result.reason);
        }
      });

      // Add successful files
      if (successfulFiles.length > 0) {
        setOtherImages((prevImages) => [...prevImages, ...successfulFiles]);
        
        // Show success message
        if (successfulFiles.length === filesToProcess.length) {
          // All succeeded
          if (successfulFiles.length > 1) {
            toast.success(`${successfulFiles.length} ${t("images") || "images"} ${t("uploaded") || "uploaded successfully"}`);
          }
        } else {
          // Some succeeded, some failed
          toast.success(
            `${successfulFiles.length} ${t("images") || "images"} ${t("uploaded") || "uploaded"}. ` +
            `${failedFiles.length} ${t("failed") || "failed"}.`
          );
        }
      }

      // Show error for failed files
      if (failedFiles.length > 0) {
        const failedNames = failedFiles.map(f => f.name).join(', ');
        toast.error(
          `${failedFiles.length} ${t("image") || "image"}(s) ${t("failed") || "failed"}: ${failedNames}`
        );
      }
    },
    [OtherImages, createStableFile, setOtherImages]
  );

  const {
    getRootProps: getRootOtheProps,
    getInputProps: getInputOtherProps,
    isDragActive: isDragOtherActive,
  } = useDropzone({
    onDrop: onOtherDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    multiple: true,
  });

  const removeOtherImage = (index, file) => {
    // Revoke object URL when removing image
    if (!objectUrlsRef.current.otherUrls) {
      objectUrlsRef.current.otherUrls = [];
    }
    const otherUrlsRef = objectUrlsRef.current.otherUrls;
    if (otherUrlsRef[index]) {
      URL.revokeObjectURL(otherUrlsRef[index]);
      otherUrlsRef[index] = null;
    }
    
    setOtherImages((prevImages) => {
      const newImages = prevImages.filter((_, i) => i !== index);
      // Clean up object URLs array
      objectUrlsRef.current.otherUrls = objectUrlsRef.current.otherUrls.filter((_, i) => i !== index);
      return newImages;
    });
    
    // Handle delete ID tracking for existing images
    setDeleteImagesId((prevIds) => {
      const newId = file?.id;
      if (prevIds) {
        return `${prevIds},${newId}`;
      } else {
        return `${newId}`;
      }
    });
  };

  const filesOther = useMemo(
    () => {
      if (!OtherImages || OtherImages.length === 0) return null;

      // Initialize otherUrls if not exists
      if (!objectUrlsRef.current.otherUrls) {
        objectUrlsRef.current.otherUrls = [];
      }

      // Clean up old object URLs for other images (only for File objects)
      objectUrlsRef.current.otherUrls.forEach(url => {
        if (url && typeof url === 'string') URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.otherUrls = [];

      return OtherImages.map((file, index) => {
        // Check if it's an existing image (has image property) or new File object
        const isExistingImage = file.image && typeof file.image === 'string';
        let imageSrc;
        let objectUrl;

        if (isExistingImage) {
          // Existing image from server - use the URL directly
          imageSrc = file.image;
        } else {
          // New uploaded file - create object URL
          try {
            objectUrl = URL.createObjectURL(file);
            objectUrlsRef.current.otherUrls[index] = objectUrl;
            imageSrc = objectUrl;
          } catch (error) {
            console.error('Error creating object URL:', error);
            return null;
          }
        }

        return (
          <div key={index} className="dropbox_img_div multiple_images">
            <img
              className="dropbox_img"
              loading="lazy"
              src={imageSrc}
              alt={file.name || "Image"}
              onError={(e) => {
                console.error('Image load error:', e);
                // Fallback: try to recreate the URL (only for File objects)
                if (!isExistingImage) {
                  try {
                    if (objectUrlsRef.current.otherUrls?.[index]) {
                      URL.revokeObjectURL(objectUrlsRef.current.otherUrls[index]);
                    }
                    const newUrl = URL.createObjectURL(file);
                    objectUrlsRef.current.otherUrls[index] = newUrl;
                    e.target.src = newUrl;
                  } catch (error) {
                    console.error('Error recreating object URL:', error);
                  }
                }
              }}
            />
            <div className="dropbox_d">
              <button
                className="close_icon_cont img_upl_close"
                onClick={() => removeOtherImage(index, file)}
              >
                <MdClose size={14} color="black" className="upd_img_rem_icon" />
              </button>
              <div className="dropbox_img_deatils">
                <span>{file.name || t("uploadedImage")}</span>
                <span>{file.size ? Math.round(file.size / 1024) + " KB" : ""}</span>
              </div>
            </div>
          </div>
        );
      }).filter(Boolean); // Remove any null entries
    },
    [OtherImages]
  );

  return (
    <>
      {/* main image upload  */}
      <div className="col-lg-6">
        <div className="picHeadDiv">
          <span className="picHeadline">{t("mainPicture")}</span>
          <span>
            <MdInfoOutline />
          </span>
        </div>
        <div className="image-upload">
          <div
            className="dropbox"
            {...getRootProps()}
            style={{ display: (typeof uploadedImages === "string" || (uploadedImages && uploadedImages.length > 0)) ? "none" : "" }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <span>{t("dropFiles")}</span>
            ) : (
              <span className="img_text_wrap">
                <span className="upld_icon_text">
                  <HiOutlineUpload size={24} color="#00B2CA" />
                  <span className="imgUpload_text">{t("chooseFromPhoneOtherImages")}</span>
                </span>
                <span className="or">{t("or")}</span>
                <span>{t("dragFiles")}</span>
              </span>
            )}
          </div>
          <div>{files}</div>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="picHeadDiv">
          <span className="picHeadline">{t("otherPicture")}</span>
          <span>
            <MdInfoOutline />
          </span>
        </div>
        <div className="image-upload">
          <div
            className="dropbox"
            {...getRootOtheProps()}
            style={{ display: OtherImages.length >= 5 ? "none" : "" }}
          >
            <input {...getInputOtherProps()} />
            {isDragOtherActive ? (
              <span>{t("dropFiles")}</span>
            ) : (
              <span className="img_text_wrap">
                <span className="upld_icon_text">
                  <HiOutlineUpload size={24} color="#00B2CA" />
                  <span className="imgUpload_text">{t("chooseFromPhoneOtherImages")}</span>
                </span>
                <span className="or">{t("or")}</span>
                <span>{t("dragFiles")}</span>
              </span>
            )}
          </div>
          <div>{filesOther}</div>
        </div>
      </div>
      <div className="col-12">
        <div className="formBtns">
          <button className="backBtn" onClick={handleGoBack}>
            {t("back")}
          </button>
          <button className="nextBtn" onClick={handleImageSubmit}>
            {t("next")}
          </button>
        </div>
      </div>
    </>
  );
};

export default ContentFour;
