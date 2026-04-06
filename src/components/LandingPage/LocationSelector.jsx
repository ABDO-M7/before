"use client";
import { useEffect, useRef, useState } from "react";
import { MdOutlineKeyboardArrowRight, MdArrowBack } from "react-icons/md";
import PlacesSkeleton from "../Skeleton/PlacesSkeleton";
import { useInView } from "react-intersection-observer";
import NoData from "../NoDataFound/NoDataFound";
import { t } from "@/utils";
import toast from "@/utils/toast";
import {
  getCoutriesApi,
  getStatesApi,
  getCitiesApi,
  getAreasApi,
  getLocationApi,
} from "@/utils/api";
import { BiCurrentLocation, BiInfoCircle } from "react-icons/bi";
import { IoSearch } from "react-icons/io5";
import { useDebounce } from "use-debounce";
import {
  resetCityData,
  saveCity,
  setKilometerRange,
} from "@/redux/reuducer/locationSlice";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getIsPaidApi, getMinRange } from "@/redux/reuducer/settingSlice";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import useSearchAutocomplete from "./useSearchAutocomplete";
import SearchAutocomplete from "./SearchAutocomplete";
import axios from "axios";

const LocationSelector = ({
  OnHide,
  setSelectedCity,
  setIsMapLocation,
}) => {
  const [selectedLocation, setSelectedLocation] = useState({
    country: null,
    state: null,
    city: null,
    area: null,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [currentView, setCurrentView] = useState("countries");
  const [locationData, setLocationData] = useState({
    items: [],
    currentPage: 1,
    hasMore: false,
    isLoading: false,
    isLoadMore: false,
  });

  const skipNextSearchEffect = useRef(false);
  const viewHistory = useRef([]);
  const [locationStatus, setLocationStatus] = useState(null);
  const { ref, inView } = useInView();
  const minLength = useSelector(getMinRange);
  const dispatch = useDispatch();
  const router = useRouter();
  const IsPaidApi = useSelector(getIsPaidApi);
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const isArabic = CurrentLanguage?.code === "ar";
  const saveOnSuggestionClick = true;

  // Helper function to get display name (Arabic if available, otherwise English)
  const getDisplayName = (item) => {
    if (isArabic && item?.name_ar && item.name_ar.trim() !== '') {
      return item.name_ar;
    }
    return item?.name || '';
  };


  const {
    search: autoSearch,
    setSearch: setAutoSearch,
    handleSearchChange,
    handleInputFocus,
    handleInputBlur,
    handleSuggestionClick,
    autoState,
  } = useSearchAutocomplete(saveOnSuggestionClick, null, OnHide);



  useEffect(() => {
    if (skipNextSearchEffect.current) {
      skipNextSearchEffect.current = false;
      return;
    }
    fetchData(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    if (inView && locationData?.hasMore && !locationData?.isLoading) {
      fetchData(debouncedSearch, locationData?.currentPage + 1);
    }
  }, [inView]);

  const handleSubmitLocation = () => {
    minLength > 0
      ? dispatch(setKilometerRange(minLength))
      : dispatch(setKilometerRange(0));
    router.push("/home");
  };

  const fetchData = async (
    search = "",
    page = 1,
    view = currentView,
    location = selectedLocation
  ) => {
    try {
      setLocationData((prev) => ({
        ...prev,
        isLoading: page === 1,
        isLoadMore: page > 1,
      }));

      let response;
      let apiPath = "";
      let requestParams = {};

      const params = { page };
      if (search) {
        params.search = search;
      }

      switch (view) {
        case "countries":
          requestParams = params;
          apiPath = "countries";
          response = await getCoutriesApi.getCoutries(params);
          break;
        case "states":
          requestParams = {
            ...params,
            country_id: location.country.id,
          };
          apiPath = "states";
          response = await getStatesApi.getStates(requestParams);
          break;
        case "cities":
          requestParams = {
            ...params,
            state_id: location.state.id,
          };
          apiPath = "cities";
          response = await getCitiesApi.getCities(requestParams);
          break;
        case "areas":
          requestParams = {
            ...params,
            city_id: location.city.id,
          };
          apiPath = "areas";
          response = await getAreasApi.getAreas(requestParams);
          break;
      }

      // Log API details for Postman
      const baseURL = `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`;
      const fullUrl = `${baseURL}${apiPath}`;
      const queryString = new URLSearchParams(requestParams).toString();
      const finalUrl = queryString ? `${fullUrl}?${queryString}` : fullUrl;

      // console.log("==========================================");
      // console.log("📍 LOCATION API REQUEST - POSTMAN READY");
      // console.log("==========================================");
      // console.log("Method: GET");
      // console.log("URL:", finalUrl);
      // console.log("Query Parameters:", JSON.stringify(requestParams, null, 2));
      // console.log("==========================================");

      if (response.data.error === false) {
        const items = response.data.data.data;

        // MOD: if no results and not on countries, auto-save & close
        if (items.length === 0 && view !== "countries" && !search) {
          let locationData = {};
          switch (view) {
            case "states":
              locationData = {
                city: "",
                state: "",
                country: location.country.name,
                lat: location.country.latitude,
                long: location.country.longitude,
              };
              break;
            case "cities":
              locationData = {
                city: "",
                state: location.state.name,
                country: location.country.name,
                lat: location.state.latitude,
                long: location.state.longitude,
              };
              break;
            case "areas":
              locationData = {
                city: location.city.name,
                state: location.state.name,
                country: location.country.name,
                lat: location.city.latitude,
                long: location.city.longitude,
              };
              break;
          }
          
          // console.log("==========================================");
          // console.log("💾 LOCATION SAVED - DATA");
          // console.log("==========================================");
          // console.log("Location Payload:", JSON.stringify(locationData, null, 2));
          // console.log("==========================================");
          
          saveCity(locationData);
          handleSubmitLocation();
          OnHide();
          return; // stop further processing
        }
        setLocationData((prev) => ({
          ...prev,
          items:
            page > 1
              ? [...prev.items, ...response.data.data.data]
              : response.data.data.data,
          hasMore:
            response.data.data.current_page < response.data.data.last_page,
          currentPage: response.data.data.current_page,
        }));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLocationData((prev) => ({
        ...prev,
        isLoading: false,
        isLoadMore: false,
      }));
    }
  };

  const getFormattedLocation = () => {
    if (!selectedLocation) return t("location");
    const parts = [];
    if (selectedLocation.area) parts.push(getDisplayName(selectedLocation.area));
    if (selectedLocation.city) parts.push(getDisplayName(selectedLocation.city));
    if (selectedLocation.state) parts.push(getDisplayName(selectedLocation.state));
    if (selectedLocation.country)
      parts.push(getDisplayName(selectedLocation.country));

    return parts.length > 0 ? parts.join(", ") : t("location");
  };

  const handleItemSelect = async (item) => {
    // MOD: push current state onto history
    viewHistory.current.push({
      view: currentView,
      location: selectedLocation,
      dataState: locationData,
      search: search,
    });

    let nextView = "";
    let newLocation = {};

    switch (currentView) {
      case "countries":
        newLocation = {
          ...selectedLocation,
          country: item,
          state: null,
          city: null,
          area: null,
        };
        nextView = "states";
        break;
      case "states":
        newLocation = {
          ...selectedLocation,
          state: item,
          city: null,
          area: null,
        };
        nextView = "cities";
        break;
      case "cities":
        newLocation = {
          ...selectedLocation,
          city: item,
          area: null,
        };
        nextView = "areas";
        break;
      case "areas":
        const locationData = {
          country: selectedLocation?.country?.name,
          state: selectedLocation?.state?.name,
          city: selectedLocation?.city?.name,
          area: item?.name,
          areaId: item?.id,
        };
        
        // console.log("==========================================");
        // console.log("💾 LOCATION SAVED - DATA");
        // console.log("==========================================");
        // console.log("Location Payload:", JSON.stringify(locationData, null, 2));
        // console.log("==========================================");
        
        saveCity(locationData);
        handleSubmitLocation();
        OnHide();
        return;
    }
    setSelectedLocation(newLocation);
    setCurrentView(nextView);
    await fetchData("", 1, nextView, newLocation);
    if (search) {
      skipNextSearchEffect.current = true;
      setSearch("");
    }
  };

  const handleBack = async () => {
    const prev = viewHistory.current.pop();
    if (!prev) return;

    setCurrentView(prev.view);
    setSelectedLocation(prev.location);

    if (search !== prev.search) {
      skipNextSearchEffect.current = true;
      setSearch(prev.search);
    }
    if (prev.dataState) {
      setLocationData(prev.dataState);
    } else {
      await fetchData(prev.search ?? "", 1, prev.view, prev.location);
    }
  };

  const handleAllSelect = () => {
    switch (currentView) {
      case "countries":
        resetCityData();
        handleSubmitLocation();
        OnHide();
        break;
      case "states":
        const stateLocationData = {
          city: "",
          state: "",
          country: selectedLocation?.country?.name,
          lat: selectedLocation?.country?.latitude,
          long: selectedLocation?.country?.longitude,
        };
        // console.log("==========================================");
        // console.log("💾 LOCATION SAVED - DATA");
        // console.log("==========================================");
        // console.log("Location Payload:", JSON.stringify(stateLocationData, null, 2));
        // console.log("==========================================");
        saveCity(stateLocationData);
        handleSubmitLocation();
        OnHide();
        break;
      case "cities":
        const cityLocationData = {
          city: "",
          state: selectedLocation?.state?.name,
          country: selectedLocation?.country?.name,
          lat: selectedLocation?.state?.latitude,
          long: selectedLocation?.state?.longitude,
        };
        // console.log("==========================================");
        // console.log("💾 LOCATION SAVED - DATA");
        // console.log("==========================================");
        // console.log("Location Payload:", JSON.stringify(cityLocationData, null, 2));
        // console.log("==========================================");
        saveCity(cityLocationData);
        handleSubmitLocation();
        OnHide();
        break;
      case "areas":
        const areaLocationData = {
          city: selectedLocation?.city?.name,
          state: selectedLocation?.state?.name,
          country: selectedLocation?.country?.name,
          lat: selectedLocation?.city?.latitude,
          long: selectedLocation?.city?.longitude,
        };
        // console.log("==========================================");
        // console.log("💾 LOCATION SAVED - DATA");
        // console.log("==========================================");
        // console.log("Location Payload:", JSON.stringify(areaLocationData, null, 2));
        // console.log("==========================================");
        saveCity(areaLocationData);
        handleSubmitLocation();
        OnHide();
        break;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case "countries":
        return t("country");
      case "states":
        return t("state");
      case "cities":
        return t("city");
      case "areas":
        return t("area");
    }
  };

  const getAllButtonTitle = () => {
    switch (currentView) {
      case "countries":
        return t("allCountries");
      case "states":
        return `${t("all_in")} ${getDisplayName(selectedLocation.country)}`;
      case "cities":
        return `${t("all_in")} ${getDisplayName(selectedLocation.state)}`;
      case "areas":
        return `${t("all_in")} ${getDisplayName(selectedLocation.city)}`;
      default:
        return t("allCountries");
    }
  };

  const getPlaceholderText = () => {
    switch (currentView) {
      case "countries":
        return `${t("search")} ${t("country")}`;
      case "states":
        return `${t("search")} ${t("state")}`;
      case "cities":
        return `${t("search")} ${t("city")}`;
      case "areas":
        return `${t("search")} ${t("area")}`;
      default:
        return `${t("search")} Location`;
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus("fetching");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            if (IsPaidApi) {
              const params = {
                lat: latitude,
                lng: longitude,
                lang: "en",
              };
              
              // Log API details for Postman
              const baseURL = `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`;
              const fullUrl = `${baseURL}/get-location`;
              const queryString = new URLSearchParams(params).toString();
              const finalUrl = `${fullUrl}?${queryString}`;

              // console.log("==========================================");
              // console.log("📍 CURRENT LOCATION API REQUEST - POSTMAN READY");
              // console.log("==========================================");
              // console.log("Method: GET");
              // console.log("URL:", finalUrl);
              // console.log("Query Parameters:", JSON.stringify(params, null, 2));
              // console.log("==========================================");
              
              const response = await getLocationApi.getLocation(params);
              if (response?.data.error === false) {
                let city = "";
                let state = "";
                let country = "";
                let address = "";
                const results = response?.data?.data?.results;
                results?.forEach((result) => {
                  const addressComponents = result.address_components;
                  const getAddressComponent = (type) => {
                    const component = addressComponents.find((comp) =>
                      comp.types.includes(type)
                    );
                    return component ? component.long_name : "";
                  };
                  if (!city) city = getAddressComponent("locality");
                  if (!state)
                    state = getAddressComponent("administrative_area_level_1");
                  if (!country) country = getAddressComponent("country");
                  if (!address) address = result?.formatted_address;
                });

                const cityData = {
                  lat: latitude,
                  long: longitude,
                  city,
                  state,
                  country,
                  formattedAddress: address,
                };
                setSelectedCity(cityData);
              } else {
                setLocationStatus("error");
                const errorMessage = isArabic
                  ? "تعذر الحصول على تفاصيل الموقع. يرجى اختيار الموقع يدوياً من القائمة أدناه."
                  : "Unable to get location details. Please select your location manually from the list below.";
                toast.error(errorMessage, { duration: 5000 });
                return;
              }
            } else {
              const nominatimResponse = await axios.get(
                "https://nominatim.openstreetmap.org/reverse",
                {
                  params: {
                    format: "json",
                    lat: latitude,
                    lon: longitude,
                    "accept-language": "en",
                    zoom: 10,
                  },
                }
              );
              const data = nominatimResponse.data.address;
              const formattedAddress = [data?.city, data?.state, data?.country].filter(Boolean).join(", ");
              const cityData = {
                lat: latitude,
                long: longitude,
                city: data.city || "",
                state: data.state || "",
                country: data.country || "",
                formattedAddress
              };
              setSelectedCity(cityData);
            }

            setIsMapLocation(true);
            setLocationStatus(null);
          } catch (err) {
            console.error("Error fetching location details:", err);
            setLocationStatus("error");
            const errorMessage = isArabic 
              ? "تعذر الحصول على موقعك. يرجى اختيار الموقع يدوياً من القائمة أدناه."
              : "Unable to get your location. Please select your location manually from the list below.";
            toast.error(errorMessage, { duration: 5000 });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationStatus("denied");
            const deniedMessage = isArabic
              ? "تم رفض إذن الموقع. يرجى اختيار الموقع يدوياً من القائمة أدناه."
              : "Location permission denied. Please select your location manually from the list below.";
            toast.error(deniedMessage, { duration: 5000 });
          } else {
            setLocationStatus("error");
            const errorMessage = isArabic
              ? "حدث خطأ في الحصول على موقعك. يرجى اختيار الموقع يدوياً من القائمة أدناه."
              : "An error occurred while getting your location. Please select your location manually from the list below.";
            toast.error(errorMessage, { duration: 5000 });
          }
        }
      );
    } else {
      toast.error(t("geoLocationNotSupported"));
    }
  };

  return (
    <>
      <div className="location_header_wrapper">
        {currentView !== "countries" && (
          <button className="back_button" onClick={handleBack}>
            <MdArrowBack size={20} />
          </button>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h5 className="head_loc" style={{ margin: 0 }}>{getFormattedLocation()}</h5>
          <div 
            className="hint_container" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              marginTop: '4px'
            }}
          >
            <BiInfoCircle 
              size={14} 
              style={{ 
                color: 'rgba(0, 0, 0, 0.45)',
                flexShrink: 0
              }} 
            />
            <span 
              className="hint_text"
              style={{
                fontSize: '12px',
                color: 'rgba(0, 0, 0, 0.64)',
                lineHeight: '1.4'
              }}
            >
              {t("locationHint")}
            </span>
          </div>
        </div>
      </div>
      <div className="location_search_wrapper">
        <IoSearch className="location_search_icon" />
        {
          currentView === "countries" ?
            <SearchAutocomplete
              search={autoSearch}
              handleSearchChange={handleSearchChange}
              handleInputFocus={handleInputFocus}
              handleInputBlur={handleInputBlur}
              autoState={autoState}
              handleSuggestionClick={handleSuggestionClick}
            />
            :
            <input
              className="location_search_input"
              type="text"
              placeholder={getPlaceholderText()}
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
        }
      </div>
      <div className="location_manual_wrapper">
        {currentView === "countries" && (
          <div className="current_location_wrapper">
            <BiCurrentLocation size={22} className="location_search_icon" />
            <button
              className="current_location_text"
              disabled={false}
              onClick={getCurrentLocation}
            >
              <p className="current_location_text_title">
                {t("useCurrentLocation")}
              </p>
              <p className="current_location_text_desc">
                {locationStatus === "fetching"
                  ? t("gettingLocation")
                  : locationStatus === "denied"
                    ? t("locationPermissionDenied")
                    : locationStatus === "error"
                      ? t("error")
                      : t("automaticallyDetectLocation")}
              </p>
            </button>
          </div>
        )}
        <div className="location_places_wrapper">
          <button className="location_places" onClick={handleAllSelect}>
            <p className="places_title">{getAllButtonTitle()}</p>
            <div className="places_arrow">
              <MdOutlineKeyboardArrowRight size={20} />
            </div>
          </button>

          <div className="location_places_list">
            {locationData.isLoading ? (
              <PlacesSkeleton />
            ) : (
              <>
                {locationData.items.length > 0 ? (
                  locationData.items.map((item, index) => (
                    <button
                      className="location_places"
                      key={item?.id}
                      onClick={() => handleItemSelect(item)}
                      ref={
                        index === locationData.items.length - 1 &&
                          locationData.hasMore
                          ? ref
                          : null
                      }
                    >
                      <p className="places_title">{getDisplayName(item)}</p>
                      <div className="places_arrow">
                        <MdOutlineKeyboardArrowRight size={20} />
                      </div>
                    </button>
                  ))
                ) : (
                  <NoData name={getTitle()} />
                )}
                {locationData.isLoadMore && (
                  <div className="loader-container-otp">
                    <div className="loader-otp"></div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationSelector;
