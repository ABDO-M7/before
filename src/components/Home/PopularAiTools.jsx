"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { t, getCompressedImage, normalizeImageUrl } from "@/utils";
// import { formatDateMonth } from "@/utils"; // unused
import { getAiToolsApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import Image from "next/image";
import HTMLContentRenderer from '@/components/DynamicHTMLContent/HTMLContentRenderer';
import AiToolsSkeleton from "../Skeleton/AiToolsSkeleton";

const PopularAiTools = ({ initialAiToolData: initialAiToolDataProp }) => {
  const [isLoading, setIsLoading] = useState(!initialAiToolDataProp);
  const [featuredTool, setFeaturedTool] = useState(initialAiToolDataProp ?? null);
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const lastFetchedLangIdRef = useRef(null);

  const getFeaturedToolData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAiToolsApi.getAiTools({
        featured: 1,
        hub: 'web'
      });
      // The updated backend returns the tool object directly when featured is 1
      const data = response.data.data;
      setFeaturedTool(data);
    } catch (error) {
      console.error("Error fetching featured AI Tool:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialAiToolDataProp) {
      setFeaturedTool(initialAiToolDataProp);
      setIsLoading(false);
      return;
    }
    if (lastFetchedLangIdRef.current === CurrentLanguage?.id) return;
    lastFetchedLangIdRef.current = CurrentLanguage?.id;
    getFeaturedToolData();
  }, [CurrentLanguage, getFeaturedToolData, initialAiToolDataProp]);

  // ✅ Shimmer: 400px height skeleton to prevent CLS
  if (isLoading) {
    return <AiToolsSkeleton />;
  }

  if (!featuredTool) {
    return <></>;
  }

  return (
    <div className="container main_padding">
      {/* <div className="row mrg_btm">
            <div className="col-12">
                <div className="pop_cat_header">
                    <h2 className="pop_cat_head">{t("aiTools")}</h2>
                </div>
            </div>
        </div> */}
      <div className="row">
        <div className="col-12">
          <div className="single_blog border-0 p-0">
            <div className="blog_content p-0">
              {featuredTool?.show_title && (
                <h2 className="blog_heading">{featuredTool?.title}</h2>
              )}

              {featuredTool?.show_image && featuredTool?.image && (
                <div className="mb-4 overflow-hidden rounded-3">
                  <Image
                    priority={!!initialAiToolDataProp}
                    loading={initialAiToolDataProp ? "eager" : "lazy"}
                    src={normalizeImageUrl(getCompressedImage(featuredTool, 'large', featuredTool.image))}
                    width={1200}
                    height={600}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
                    className="blog_main_img"
                    alt={featuredTool?.title || "Featured AI Tool"}
                    style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div>
                <HTMLContentRenderer
                  htmlContent={featuredTool?.description || ''}
                  contentId={`featured-tool-description-${featuredTool?.id}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularAiTools;
