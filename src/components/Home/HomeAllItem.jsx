"use client";
import { settingsData } from "@/redux/reuducer/settingSlice";
import { allItemApi } from "@/utils/api";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { userSignUpData } from "../../redux/reuducer/authSlice";
import ProductCardSkeleton from "../Skeleton/ProductCardSkeleton.jsx";
import ProductCard from "../Cards/ProductCard.jsx";
import { getKilometerRange } from "@/redux/reuducer/locationSlice.js";
import { t } from "@/utils";
import NoData from "../NoDataFound/NoDataFound";

const HomeAllItem = ({ cityData, allEmpty }) => {
  const KmRange = useSelector(getKilometerRange);
  const systemSettingsData = useSelector(settingsData);
  const settings = systemSettingsData?.data;
  const isDemoMode = settings?.demo_mode;
  const userData = useSelector(userSignUpData);
  const [AllItemData, setAllItemData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadMore, setIsLoadMore] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const getAllItemData = async (page) => {
    if (page === 1) {
      setIsLoading(true);
    }
    try {
      const params = {
        page,
        limit: 12,
      };
      if (!isDemoMode) {
        if (KmRange > 0) {
          // Add location-based parameters for non-demo mode
          params.radius = KmRange;
          params.latitude = cityData.lat;
          params.longitude = cityData.long;
        } else {
          // Add location hierarchy parameters for non-demo mode
          if (cityData?.areaId) {
            params.area_id = cityData.areaId;
          } else if (cityData?.city) {
            params.city = cityData.city;
          } else if (cityData?.state) {
            params.state = cityData.state;
          } else if (cityData?.country) {
            params.country = cityData.country;
          }
        }
      }
      const response = await allItemApi.getItems(params);
      if (response?.data?.data?.data?.length > 0) {
        const data = response?.data?.data?.data;
        if (page === 1) {
          setAllItemData(data);
          setDataLoaded(true);
        } else {
          setAllItemData((prevData) => [...prevData, ...data]);
        }
        const currentPage = response?.data?.data?.current_page;
        const lastPage = response?.data?.data?.last_page;
        setHasMore(currentPage < lastPage);
        setCurrentPage(currentPage);
      } else {
        setAllItemData([]);
        setDataLoaded(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  };

  // Removed auto-fetch to improve page load performance
  // Data will only be fetched when user clicks "All Advertisements" button

  const handleLikeAllData = (id) => {
    const updatedItems = AllItemData.map((item) => {
      if (item.id === id) {
        return { ...item, is_liked: !item.is_liked };
      }
      return item;
    });
    setAllItemData(updatedItems);
  };

  const handleLoadMore = () => {
    if (!showAllItems) {
      // If section is hidden, show it first, then fetch data if not loaded
      setShowAllItems(true);
      if (!dataLoaded) {
        getAllItemData(1);
      }
    } else {
      // If section is visible, load more items
      setIsLoadMore(true);
      getAllItemData(currentPage + 1);
    }
  };

  return (
    <div className="container">
      {showAllItems && isLoading ? (
        <div className="row row-cols-xxl-4 row-cols-lg-4 row-cols-md-3 row-cols-2 top_spacing product_card_card_gap">
          {[...Array(10)].map((_, index) => (
            <div className="col" key={index}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <>
          {showAllItems && AllItemData && AllItemData.length > 0 && (
            <>
              <div className={`row ${!allEmpty && "allItemTopSpace"}`}>
                <div className="col-12 d-flex justify-content-between align-items-center">
                  <h2 className="pop_cat_head">
                    <i className="fas fa-bullhorn me-2"></i>
                    {t("allAdvertisements")}
                  </h2>
                </div>
              </div>
              <div className="row row-cols-xxl-4 row-cols-lg-4 row-cols-md-3 row-cols-2 product_card_card_gap top_spacing">
                {AllItemData.map((data, index) => (
                  <div
                    className="col product_card_card_gap"
                    key={index}
                  >
                    <ProductCard data={data} handleLike={handleLikeAllData} priority={index === 0} />
                  </div>
                ))}
              </div>
            </>
          )}
          {showAllItems && allEmpty && AllItemData.length === 0 && !isLoading && <NoData name={t("ads")} />}
        </>
      )}

      {isLoadMore ? (
        <div className="loader adListingLoader"></div>
      ) : (
        (!showAllItems || (showAllItems && hasMore)) && (
          <div className="loadMore">
            <button
              onClick={handleLoadMore}
              disabled={isLoading || isLoadMore}
              aria-label={showAllItems ? t("loadMore") : t("seeAllAdvertisements") || "View All Advertisements"}
            >
              {showAllItems ? t("loadMore") : t("seeAllAdvertisements") || "View All Advertisements"}
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default HomeAllItem;
