'use client'
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import BreadcrumbComponent from '../../Breadcrumb/BreadcrumbComponent'
import ContentZero from './ContentZero'
import ContentOne from './ContentOne'
import ContentTwo from './ContentTwo'
import ContentThree from './ContentThree'
import ContentFour from './ContentFour'
import ContentFive from './ContentFive'
import AdSuccessfulModal from './AdSuccessfulModal'
import { useSelector } from 'react-redux'
import { generateSlug, isLogin, isValidURL, t } from '@/utils'
import { addItemApi, categoryApi, getAreasApi, getCitiesApi, getCoutriesApi, getCustomFieldsApi, getLocationApi, getStatesApi } from '@/utils/api'
import toast from "@/utils/toast";
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice';
import { getIsPaidApi, settingsData } from '@/redux/reuducer/settingSlice'
import { getIsLoginModalOpen, getIsRegisterModalOpen, toggleLoginModal, toggleRegisterModal } from '@/redux/reuducer/globalStateSlice'
import { getIsLoggedIn } from '@/redux/reuducer/authSlice'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import MailSentSucessfully from '../../Auth/MailSentSucessfully'
import { Modal } from 'antd'
// ✅ Lazy load auth modals (heavy: react-phone-input-2, antd)
const LoginModal = dynamic(() => import('../../Auth/LoginModal'), { ssr: false })
const RegisterModal = dynamic(() => import('../../Auth/RegisterModal'), { ssr: false })

const AdListing = () => {
  const router = useRouter()
  const CurrentLanguage = useSelector(CurrentLanguageData)
  const systemSettingsData = useSelector(settingsData)
  const settings = systemSettingsData?.data
  const [currentPage, setCurrentPage] = useState()
  const [lastPage, setLastPage] = useState()
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState(1)
  const [IsAdSuccessfulModal, setIsAdSuccessfulModal] = useState(false)
  const [CurrenCategory, setCurrenCategory] = useState([])
  const [CurrentPath, setCurrentPath] = useState([])
  const is_job_category = CurrentPath[CurrentPath.length - 1]?.is_job_category === 1
  const isPriceOptional = CurrentPath[CurrentPath.length - 1]?.price_optional === 1;
  const IsPaidApi = useSelector(getIsPaidApi);

  const [CustomFields, setCustomFields] = useState([])
  const [AdListingDetails, setAdListingDetails] = useState({
    title: '',
    slug: '',
    desc: '',
    price: '',
    phone: '',
    country_code: '',
    link: '',
    salaryMin: '',
    salaryMax: '',
    notes: '',
  })
  const [extraDetails, setExtraDetails] = useState({})
  const [uploadedImages, setUploadedImages] = useState([]);
  const [OtherImages, setOtherImages] = useState([]);
  
  // Helper function to get default location based on language
  const getDefaultLocation = (isArabic) => {
    if (isArabic) {
      return {
        country: "سوريا",
        state: "دمشق",
        city: "الزاهرة",
        address: "الزاهرة، دمشق، سوريا",
        area: "",
        lat: 33.4856,
        long: 36.2981
      };
    }
    return {
      country: "Syria",
      state: "Damascus",
      city: "Al-Zahira",
      address: "Al zahira, Al-Zahira, Damascus, Syria",
      area: "",
      lat: 33.4856,
      long: 36.2981
    };
  };

  const [Location, setLocation] = useState(() => {
    const isArabic = CurrentLanguage?.code === "ar";
    return getDefaultLocation(isArabic);
  })
  const [CountryStore, setCountryStore] = useState({
    Countries: [],
    SelectedCountry: {},
    CountrySearch: '',
    currentPage: 1,
    hasMore: false,
  })
  const [StateStore, setStateStore] = useState({
    States: [],
    SelectedState: {},
    StateSearch: '',
    currentPage: 1,
    hasMore: false,
  })
  const [CityStore, setCityStore] = useState({
    Cities: [],
    SelectedCity: {},
    CitySearch: '',
    currentPage: 1,
    hasMore: false,
  })
  const [AreaStore, setAreaStore] = useState({
    Areas: [],
    SelectedArea: {},
    AreaSearch: '',
    currentPage: 1,
    hasMore: false,
  })
  const [Address, setAddress] = useState('')
  const [isAdPlaced, setIsAdPlaced] = useState(false)
  const [CreatedAdSlug, setCreatedAdSlug] = useState('')
  const [DisabledTab, setDisabledTab] = useState({
    selectCategory: false, // On mobile, selectCategory is always accessible
    details: true,
    extraDet: true,
    img: true,
    loc: true
  })
  const [IsLoading, setIsLoading] = useState(false)
  const [IsLoadMoreCat, setIsLoadMoreCat] = useState(false)
  const [filePreviews, setFilePreviews] = useState({});
  const [IsMailSentOpen, setIsMailSentOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [shouldAutoSubmitLogin, setShouldAutoSubmitLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldBlockBackRef = useRef(false);
  const isNavigatingAwayRef = useRef(false);
  
  // Get modal states from Redux
  const IsLoginModalOpen = useSelector(getIsLoginModalOpen);
  const IsRegisterModalOpen = useSelector(getIsRegisterModalOpen);
  const IsLoggedIn = useSelector(getIsLoggedIn);

  // Update default location when language changes (only if still at default values)
  useEffect(() => {
    if (CurrentLanguage?.code) {
      const isArabic = CurrentLanguage.code === "ar";
      const isDefaultLocation = 
        (Location.country === "Syria" || Location.country === "سوريا") &&
        (Location.state === "Damascus" || Location.state === "دمشق") &&
        (Location.city === "Al-Zahira" || Location.city === "الزاهرة");
      
      if (isDefaultLocation) {
        const newLocation = getDefaultLocation(isArabic);
        // Only update if the values are actually different to avoid unnecessary updates
        const currentIsArabic = Location.country === "سوريا";
        if (isArabic !== currentIsArabic) {
          setLocation(newLocation);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CurrentLanguage?.code]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update shouldBlockBackRef when form data changes
  useEffect(() => {
    if (!isMobile) return;
    shouldBlockBackRef.current = hasFormData();
  }, [isMobile, AdListingDetails, uploadedImages, OtherImages, CurrentPath, Location, extraDetails]);

  // Handle browser back button on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handlePopState = (event) => {
      // If we're intentionally navigating away, don't block
      if (isNavigatingAwayRef.current) {
        isNavigatingAwayRef.current = false;
        return;
      }

      // If on first page (tab 0) with no data, navigate to home immediately
      if (activeTab === 0 && !hasFormData()) {
        isNavigatingAwayRef.current = true;
        router.push('/home');
        return;
      }

      // Check if we should block back navigation - verify with hasFormData() directly
      if (shouldBlockBackRef.current && hasFormData()) {
        // Prevent the default back navigation by pushing state back
        window.history.pushState(null, '', window.location.pathname);
        // Show exit confirmation
        setShowExitConfirm(true);
      }
    };

    // Push a state to history so we can detect back button
    window.history.pushState(null, '', window.location.pathname);

    // Listen for popstate (back/forward button)
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isMobile, activeTab, router]);

  // Set initial tab based on mobile and title
  useEffect(() => {
    if (isMobile && activeTab === 1 && !AdListingDetails.title) {
      setActiveTab(0);
    } else if (!isMobile && activeTab === 0) {
      setActiveTab(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Scroll to top when tab changes (mobile only)
  useEffect(() => {
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, isMobile]);

  const getCountriesData = async (search, page) => {
    try {
      // Fetch countries
      const params = {};
      if (search) {
        params.search = search; // Send only 'search' if provided
      } else {
        params.page = page; // Send only 'page' if no search
      }

      const res = await getCoutriesApi.getCoutries(params);
      let allCountries
      if (page > 1) {
        allCountries = [...CountryStore?.Countries, ...res?.data?.data?.data]
      }
      else {
        allCountries = res?.data?.data?.data
      }
      setCountryStore(prev => ({
        ...prev,
        currentPage: res?.data?.data?.current_page,
        Countries: allCountries,
        hasMore: res?.data?.data?.current_page < res?.data?.data?.last_page ? true : false
      }))
    } catch (error) {
      console.error("Error fetching countries data:", error);
    }
  };

  const handleCountryScroll = (event) => {
    const { target } = event;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight && CountryStore?.hasMore) {
      getCountriesData('', CountryStore?.currentPage + 1)
    }
  }

  const getStatesData = async (search, page) => {
    try {

      const params = {
        country_id: CountryStore?.SelectedCountry?.id
      };
      if (search) {
        params.search = search; // Send only 'search' if provided
      } else {
        params.page = page; // Send only 'page' if no search
      }

      const res = await getStatesApi.getStates(params);

      let allStates
      if (page > 1) {
        allStates = [...StateStore?.States, ...res?.data?.data?.data]
      }
      else {
        allStates = res?.data?.data?.data
      }

      setStateStore(prev => ({
        ...prev,
        currentPage: res?.data?.data?.current_page,
        States: allStates,
        hasMore: res?.data?.data?.current_page < res?.data?.data?.last_page ? true : false
      }))

    } catch (error) {
      console.error("Error fetching states data:", error);
      return [];
    }
  };

  const handleStateScroll = (event) => {
    const { target } = event;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight && StateStore?.hasMore) {
      getStatesData('', StateStore?.currentPage + 1)
    }
  }
  const getCitiesData = async (search, page) => {
    try {
      const params = {
        state_id: StateStore?.SelectedState?.id
      };
      if (search) {
        params.search = search; // Send only 'search' if provided
      } else {
        params.page = page; // Send only 'page' if no search
      }

      const res = await getCitiesApi.getCities(params);
      let allCities
      if (page > 1) {
        allCities = [...CityStore?.Cities, ...res?.data?.data?.data]
      }
      else {
        allCities = res?.data?.data?.data
      }
      setCityStore(prev => ({
        ...prev,
        currentPage: res?.data?.data?.current_page,
        Cities: allCities,
        hasMore: res?.data?.data?.current_page < res?.data?.data?.last_page ? true : false
      }))
    } catch (error) {
      console.error("Error fetching cities data:", error);
      return [];
    }
  };

  const handleCityScroll = (event) => {
    const { target } = event;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight && CityStore?.hasMore) {
      getCitiesData('', CityStore?.currentPage + 1)
    }
  }

  const getAreaData = async (search, page) => {
    const params = {
      city_id: CityStore?.SelectedCity?.id
    };
    if (search) {
      params.search = search; // Send only 'search' if provided
    } else {
      params.page = page; // Send only 'page' if no search
    }
    try {
      const res = await getAreasApi.getAreas(params);
      let allArea
      if (page > 1) {
        allArea = [...AreaStore?.Areas, ...res?.data?.data?.data]
      }
      else {
        allArea = res?.data?.data?.data
      }
      setAreaStore(prev => ({
        ...prev,
        currentPage: res?.data?.data?.current_page,
        Areas: allArea,
        hasMore: res?.data?.data?.current_page < res?.data?.data?.last_page ? true : false
      }))
    } catch (error) {
      console.error("Error fetching cities data:", error);
      return [];
    }
  };

  const handleAreaScroll = (event) => {
    const { target } = event;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight && AreaStore?.hasMore) {
      getAreaData('', AreaStore?.currentPage + 1)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      getCountriesData(CountryStore?.CountrySearch, 1);
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [CountryStore?.CountrySearch])

  useEffect(() => {
    if (CountryStore?.SelectedCountry?.id) {
      const timeout = setTimeout(() => {
        getStatesData(StateStore?.StateSearch, 1);
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [CountryStore?.SelectedCountry?.id, StateStore?.StateSearch])

  useEffect(() => {
    if (StateStore?.SelectedState?.id) {
      const timeout = setTimeout(() => {
        getCitiesData(CityStore?.CitySearch, 1);
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [StateStore?.SelectedState?.id, CityStore?.CitySearch])

  useEffect(() => {
    if (CityStore?.SelectedCity?.id) {
      const timeout = setTimeout(() => {
        getAreaData(AreaStore?.AreaSearch);
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [CityStore?.SelectedCity?.id, AreaStore?.AreaSearch])

  const getLocationWithMap = async (pos) => {
    try {
      const { lat, lng } = pos;
      const response = await getLocationApi.getLocation({
        lat,
        lng,
        lang: 'en',
      });

      if (response?.data.error === false) {

        if (IsPaidApi) {
          let city = "";
          let state = "";
          let country = "";
          let address = "";

          const results = response?.data?.data?.results

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
          })

          const locationData = {
            lat,
            long: lng,
            city,
            state,
            country,
            address,
          };
          setLocation(locationData);
        } else {
          const results = response?.data?.data;
          const formattedAddress = [results?.area, results?.city, results?.state, results?.country].filter(Boolean).join(", ");
          const cityData = {
            lat: results?.latitude,
            long: results?.longitude,
            city: results?.city || "",
            state: results?.state || "",
            country: results?.country || "",
            area: results?.area || "",
            areaId: results?.area_id || "",
            address: formattedAddress
          };
          setLocation(cityData);
        }
      }
      else {
        toast.error(t("errorOccurred"));
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      toast.error(t("errorOccurred"));
    }
  }

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      // Check permission status first if Permissions API is available
      let permissionStatus = null;
      if (navigator.permissions && navigator.permissions.query) {
        try {
          permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        } catch (e) {
          // Permissions API might not be fully supported, continue anyway
          console.log('Permissions API not fully supported');
        }
      }

      // If permission is denied, show helpful message
      if (permissionStatus && permissionStatus.state === 'denied') {
        toast.error(
          `${t('locationNotGranted')}`,
          { duration: 8000 }
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
          if (IsPaidApi) {
              const response = await getLocationApi.getLocation({
                lat: latitude,
                lng: longitude,
                lang: 'en',
              });
              if (response?.data.error === false) {
                let city = "";
                let state = "";
                let country = "";
                let address = "";
                const results = response?.data?.data?.results
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
                })

                const cityData = {
                  lat: latitude,
                  long: longitude,
                  city,
                  state,
                  country,
                  address,
                };
                setLocation(cityData);
              } else {
                toast.error(t("errorOccurred"));
              }
            }
            else {
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
              const data = nominatimResponse?.data?.address;

              const address = [data?.city, data?.state, data?.country].filter(Boolean).join(", ");
              const cityData = {
                lat: latitude,
                long: longitude,
                city: data.city || "",
                state: data.state || "",
                country: data.country || "",
                address
              };
              setLocation(cityData);
            }
          } catch (error) {
            console.error('Error fetching location data:', error);
            toast.error(t("errorOccurred"));
          }
        },
        (error) => {
          // Handle different error types
          if (error.code === error.PERMISSION_DENIED) {
            toast.error(
              `${t('locationPermissionDeniedMessage')}\n${t('locationPermissionInstructions')}`,
              { duration: 8000 }
            );
          } else {
            toast.error(t('locationNotGranted'));
          }
        }
      );
    } else {
      toast.error(t('geoLocationNotSupported'));
    }
  };

  const allCategoryIdsString = CurrentPath.map(category => category.id).join(',');

  let lastItemId = CurrentPath[CurrentPath.length - 1]?.id;

  // Translate categories based on current language
  const translateCategories = (categories) => {
    return categories.map((category) => {
      const translation = category.translations?.find(
        (trans) => Number(trans.language_id) === Number(CurrentLanguage?.id)
      );
      return {
        ...category,
        translated_name: translation ? translation.name : category.name,
        subcategories:
          category.subcategories?.length > 0
            ? translateCategories(category.subcategories)
            : [],
      };
    });
  };

  const getCategoriesData = async (type) => {
    try {
      setIsLoading(true)
      const res = await categoryApi.getCategory({ category_id: type ? type : lastItemId })
      const data = res?.data?.data?.data
      // Translate categories before setting them
      const translatedData = translateCategories(data || [])
      setCurrenCategory(translatedData)
      setCurrentPage(res?.data?.data?.current_page); // Update the current page
      setLastPage(res?.data?.data?.last_page); // Update the current page
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }
  const getCustomFieldsData = async (id) => {
    try {
      const res = await getCustomFieldsApi.getCustomFields({ category_ids: allCategoryIdsString })
      const data = res?.data?.data
      setCustomFields(data)
      const newExtraDetails = {};
      data.forEach(item => {
        switch (item.type) {
          case 'checkbox':
            newExtraDetails[item.id] = []; // Initialize with an empty array
            break;
          case 'dropdown':
            newExtraDetails[item.id] = ''; // Initialize with an empty string
            break;
          case 'radio':
            newExtraDetails[item.id] = []; // Initialize with an empty string
            break;
          case 'fileinput':
            newExtraDetails[item.id] = null; // Initialize with null
            break;
          case 'textbox':
            newExtraDetails[item.id] = ''; // Initialize with an empty string
            break;
          case 'number':
            newExtraDetails[item.id] = null; // Initialize with null
            break;
          case 'text':
            newExtraDetails[item.id] = ''; // Initialize with an empty string
            break;
          default:
            break;
        }
      });
      setExtraDetails(newExtraDetails);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getCategoriesData()
  }, [lastItemId, CurrentLanguage])

  // Update CurrentPath translations when language changes
  useEffect(() => {
    if (CurrentPath.length > 0 && CurrentLanguage?.id) {
      const updatedPath = CurrentPath.map((category) => {
        const translation = category.translations?.find(
          (trans) => Number(trans.language_id) === Number(CurrentLanguage?.id)
        );
        return {
          ...category,
          translated_name: translation ? translation.name : category.name,
        };
      });
      // Only update if translation actually changed
      const hasChanged = updatedPath.some((cat, index) => 
        cat.translated_name !== CurrentPath[index]?.translated_name
      );
      if (hasChanged) {
        setCurrentPath(updatedPath);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CurrentLanguage?.id])

  const handleCategoryTabClick = async (category) => {
    // Ensure category has translated_name before adding to path
    const translation = category.translations?.find(
      (trans) => Number(trans.language_id) === Number(CurrentLanguage?.id)
    );
    const categoryWithTranslation = {
      ...category,
      translated_name: translation ? translation.name : (category.translated_name || category.name),
    };
    setCurrentPath((prevPath) => [...prevPath, categoryWithTranslation]);
    if (category?.subcategories_count > 0) {
      if (category?.subcategories?.length > 0) {
        // Translate subcategories before setting them
        const translatedSubcategories = translateCategories(category?.subcategories)
        setCurrenCategory(translatedSubcategories)
      } else {
        await getCategoriesData(category?.id)
      }
    }
    else {
      // On mobile, go to tab 2 (details), on desktop go to tab 2 (details)
      const nextTab = isMobile ? 2 : 2;
      setActiveTab(nextTab)
      setDisabledTab({
        selectCategory: false, // Keep enabled on mobile so user can navigate back
        details: false,
        extraDet: false,
        img: false,
        loc: false
      });
    }
  }

  const handleTitleSubmit = () => {
    if (!AdListingDetails.title.trim()) {
      toast.error(t('titleRequired'));
      return;
    }
    if (isMobile && !AdListingDetails.desc.trim()) {
      toast.error(t('descriptionRequired'));
      return;
    }
    // On mobile, go to category tab (1), on desktop go to category tab (1)
    setActiveTab(1);
    setDisabledTab({
      selectCategory: false, // Keep enabled on mobile so user can navigate back
      details: true,
      extraDet: true,
      img: true,
      loc: true
    });
    // Scroll to top on mobile
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }

  useEffect(() => {
    if (activeTab === 2) {
      if (allCategoryIdsString) {
        getCustomFieldsData()
      }
    }
  }, [allCategoryIdsString])

  const handleGoBack = () => {
    setActiveTab((prev) => {
      // On mobile, handle tab 0 (title)
      if (isMobile && prev === 1) {
        return 0; // Go back to title from category
      }
      if (CustomFields.length === 0 && activeTab === 4) {
        return prev - 2
      }
      else {
        return prev - 1;
      }
    })
  }

  // Mobile bottom navigation handlers
  const handleMobileNext = () => {
    if (activeTab === 0) {
      handleTitleSubmit();
    } else if (activeTab === 2) {
      handleDetailsSubmit();
    } else if (activeTab === 3) {
      submitExtraDetails();
    } else if (activeTab === 4) {
      handleImageSubmit();
    } else if (activeTab === 5) {
      handleFullSubmission();
    } else if (activeTab === 1) {
      // Category tab - can only proceed if category is selected
      if (CurrentPath.length > 0) {
        setActiveTab(2);
        setDisabledTab({
          selectCategory: false,
          details: false,
          extraDet: false,
          img: false,
          loc: false
        });
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  }


  const canProceedToNext = () => {
    if (activeTab === 0) {
      return AdListingDetails.title?.trim() && AdListingDetails.desc?.trim() ? true : false;
    } else if (activeTab === 1) {
      return CurrentPath.length > 0;
    } else if (activeTab === 2) {
      return AdListingDetails.title?.trim() && 
             AdListingDetails.desc?.trim() && 
             AdListingDetails.phone &&
             (is_job_category || isPriceOptional || AdListingDetails.price);
    } else if (activeTab === 3) {
      // Check if all required custom fields are filled (without showing errors)
      for (const field of CustomFields) {
        const { type, required, id, min_length } = field;
        if (required) {
          if (type !== 'checkbox' && type !== 'radio' && type !== 'fileinput' && !(type === 'textbox' ? extraDetails[id]?.trim() : extraDetails[id])) {
            return false;
          }
          if (type === 'fileinput' && !extraDetails[id] && !filePreviews[id]) {
            return false;
          }
          if ((type === 'checkbox' || type === 'radio') && (!extraDetails[id] || extraDetails[id].length === 0)) {
            return false;
          }
          if (extraDetails[id] && type === 'textbox' && extraDetails[id].trim().length < min_length) {
            return false;
          }
          if (extraDetails[id] && type === 'number' && String(extraDetails[id]).length < min_length) {
            return false;
          }
        }
        if (!required && extraDetails[id] && type === 'textbox' && extraDetails[id].length < min_length) {
          return false;
        }
        if (!required && extraDetails[id] && type === 'number' && String(extraDetails[id]).length < min_length) {
          return false;
        }
      }
      return true;
    } else if (activeTab === 4) {
      return uploadedImages.length > 0;
    } else if (activeTab === 5) {
      return Location?.country && Location?.state && Location?.city && Location?.address;
    }
    return false;
  }

  // Check if user has entered any data
  const hasFormData = () => {
    // Check if location is the default one (not user-selected)
    const isDefaultLocation = Location?.address === "Al-Zahira, Damascus, Syria" &&
                              Location?.country === "Syria" &&
                              Location?.state === "Damascus" &&
                              Location?.city === "Al-Zahira";
    
    // Only count location if it's not the default
    const hasLocationData = Location?.address && !isDefaultLocation;
    
    return (
      AdListingDetails.title?.trim() ||
      AdListingDetails.desc?.trim() ||
      AdListingDetails.price ||
      AdListingDetails.phone ||
      uploadedImages.length > 0 ||
      OtherImages.length > 0 ||
      CurrentPath.length > 0 ||
      hasLocationData ||
      Object.keys(extraDetails).some(key => {
        const value = extraDetails[key];
        if (Array.isArray(value)) return value.length > 0;
        if (value === null || value === undefined) return false;
        return String(value).trim() !== '';
      })
    );
  }

  const handleMobileBack = () => {
    // If on first page (tab 0) with no data, navigate to home immediately
    if (activeTab === 0 && !hasFormData()) {
      router.push('/home');
      return;
    }
    
    // Check if there's any form data before showing confirmation (only on tab 0)
    if (activeTab === 0 && hasFormData()) {
      setShowExitConfirm(true);
      return;
    }
    
    // On other tabs, go back to previous tab
    handleGoBack();
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    // Mark that we're intentionally navigating away
    isNavigatingAwayRef.current = true;
    // Navigate to home page
    router.push('/home');
  }

  const handleCancelExit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowExitConfirm(false);
  }

  const handleSelectedTabClick = (id) => {
    // Only clear CustomFields when changing category, keep all other inputs
    setCustomFields([])
    setExtraDetails({}) // Also clear extra details since they're category-specific
    if (activeTab !== 1) {
      setActiveTab(1);
      setDisabledTab({
        selectCategory: false,
        details: true,
        extraDet: true,
        img: true,
        loc: true
      });
    }
    const index = CurrentPath.findIndex(item => item.id === id);
    if (index !== -1) {
      const newPath = CurrentPath.slice(0, index);
      setCurrentPath(newPath);
    }
    if (index === 0) {
      setCurrenCategory([])
      getCategoriesData("")
      setCurrentPath([])
      setCustomFields([])
      setExtraDetails({})
    }
  };

  const handleAdListingChange = (e) => {
    const { name, value } = e.target;

    setAdListingDetails((prevDetails) => {
      const updatedDetails = {
        ...prevDetails,
        [name]: value,
      };
      if (name === 'title') {
        updatedDetails.slug = generateSlug(value);
      }
      
      return updatedDetails;
    });
  };

  const handleDetailsSubmit = () => {

    const isValidSlug = /^[a-z0-9-]+$/.test(AdListingDetails.slug.trim());

    if (AdListingDetails.title.trim() == "") {
      toast.error(t('titleRequired'))
      return;
    }
    else if (AdListingDetails.desc.trim() == "") {
      toast.error(t('descriptionRequired'))
      return;
    }
    if (is_job_category) {
      // Validation for job listings (salary min/max) - optional but validate if provided
      if (AdListingDetails.salaryMin && AdListingDetails.salaryMin < 0) {
        toast.error(t('enterValidSalaryMin'));
        return
      }
      else if (AdListingDetails.salaryMax && AdListingDetails.salaryMax < 0) {
        toast.error(t('enterValidSalaryMax'));
        return
      } else if (AdListingDetails.salaryMin && AdListingDetails.salaryMax && Number(AdListingDetails.salaryMin) === Number(AdListingDetails.salaryMax)) {
        toast.error(t('salaryMinCannotBeEqualMax'));
        return
      } else if (AdListingDetails.salaryMin && AdListingDetails.salaryMax &&
        Number(AdListingDetails.salaryMin) > Number(AdListingDetails.salaryMax)) {
        toast.error(t('salaryMinCannotBeGreaterThanMax'));
        return
      }
    } else if (!isPriceOptional && !AdListingDetails.price) {
      toast.error(t('priceRequired'))
      return;
    } else if (AdListingDetails.price && AdListingDetails?.price < 0) {
      toast.error(t("enterValidPrice"));
      return;
    }

    if (!AdListingDetails.phone) {
      toast.error(t('phoneRequired'))
      return;
    } else if (AdListingDetails.slug.trim() && !isValidSlug) {
      toast.error(t('addValidSlug'));
      return;
    }
    // On mobile, tabs are: 0=title, 1=category, 2=details, 3=extra, 4=images, 5=location
    // On desktop, tabs are: 1=category, 2=details, 3=extra, 4=images, 5=location
    if (CustomFields?.length === 0) {
      setActiveTab(isMobile ? 4 : 4)
    }
    else {
      setActiveTab(isMobile ? 3 : 3)
    }
    // Scroll to top on mobile
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }

  const submitExtraDetails = (e) => {
    if (!validateExtraDetails(CustomFields, extraDetails)) {
      return;
    }
    setActiveTab(isMobile ? 4 : 4)
    // Scroll to top on mobile
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleImageSubmit = () => {
    if (uploadedImages.length === 0) {
      toast.error(t('uploadMainPicture'))
      return
    }
    setActiveTab(isMobile ? 5 : 5)
    // Scroll to top on mobile
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }

  const validateExtraDetails = (CustomFields, extraDetails) => {
    for (const field of CustomFields) {

      const { name, type, required, id, min_length, } = field;

      if (required) {
        if (type !== 'checkbox' && type !== 'radio' && type !== 'fileinput' && !(type === 'textbox' ? extraDetails[id]?.trim() : extraDetails[id])) {
          toast.error(`${t('fillDetails')} ${name}.`);
          return false;
        }

        if (type === 'fileinput' && !extraDetails[id] && !filePreviews[id]) {
          toast.error(`${t('fillDetails')} ${name}.`);
          return false
        }

        if ((type === 'checkbox' || type === 'radio') && extraDetails[id].length === 0) {
          toast.error(`${t('selectAtleastOne')} ${name}.`);
          return false;
        }

        // Required field with min_length validation
        if (extraDetails[id] && type === 'textbox' && extraDetails[id].trim().length < min_length) {
          toast.error(`${name} ${t('mustBeAtleast')} ${min_length} ${t('charactersLong')}`);
          return false;
        }
        if (extraDetails[id] && type === 'number' && extraDetails[id].length < min_length) {
          toast.error(`${name} ${t('mustBeAtleast')} ${min_length} ${t('digitLong')}`);
          return false;
        }
      }

      // Non-required field with min_length validation
      if (!required && extraDetails[id] && type === 'textbox' && extraDetails[id].length < min_length) {
        toast.error(`${name} ${t('mustBeAtleast')} ${min_length} ${t('charactersLong')}`);
        return false;
      }

      if (!required && extraDetails[id] && type === 'number' && extraDetails[id].length < min_length) {
        toast.error(`${name} ${t('mustBeAtleast')} ${min_length} ${t('digitLong')}`);
        return false;
      }

    }
    return true;
  };


  const postAd = async () => {

    const cat = CurrentPath[CurrentPath.length - 1];
    const catId = cat.id;
    const transformedCustomFields = {};
    const customFieldFiles = [];
    Object.entries(extraDetails).forEach(([key, value]) => {
      if (value instanceof File || (Array.isArray(value) && value[0] instanceof File)) {
        customFieldFiles.push({ key, files: value });
      } else {
        transformedCustomFields[key] = Array.isArray(value) ? value : [value];
      }
    });

    const show_only_to_premium = 1;
    const allData = {
      name: AdListingDetails.title,
      slug: AdListingDetails.slug.trim(),
      description: AdListingDetails?.desc,
      category_id: catId,
      all_category_ids: allCategoryIdsString,
      price: AdListingDetails.price,
      phone: AdListingDetails.phone,
      country_code: AdListingDetails.country_code,
      video_link: AdListingDetails?.link,
      custom_fields: transformedCustomFields,
      image: uploadedImages[0],
      gallery_images: OtherImages,
      address: Location?.address,
      latitude: Location?.lat,
      longitude: Location?.long,
      custom_field_files: customFieldFiles,
      show_only_to_premium: show_only_to_premium,
      country: Location?.country,
      state: Location?.state,
      city: Location?.city,
      ...(AreaStore?.SelectedArea?.id ? { area_id: Number(AreaStore.SelectedArea.id) } : {}),
      ...(AdListingDetails.notes != null && AdListingDetails.notes !== '' ? { notes: AdListingDetails.notes } : {})
    }

    if (is_job_category) {
      // Only add salary fields if they're provided
      if (AdListingDetails.salaryMin) {
        allData.min_salary = AdListingDetails.salaryMin;
      }
      if (AdListingDetails.salaryMax) {
        allData.max_salary = AdListingDetails.salaryMax;
      }
    } else {
      allData.price = AdListingDetails.price;
    }
    try {
      setIsAdPlaced(true)
      setIsSubmitting(true)
      const res = await addItemApi.addItem(allData)
      if (res?.data?.error === false) {
        setIsAdSuccessfulModal(true)
        setCreatedAdSlug(res?.data?.data[0]?.slug)
        setIsSubmitting(false)
      }
      else {
        toast.error(res)
        setIsSubmitting(false)
      }
    } catch (error) {
      toast.error(t('mobileNumberNotFormated'))
      console.error(error)
      setIsSubmitting(false)
    } finally {
      setIsAdPlaced(false)
    }
  }

  const handleFullSubmission = () => {
    // Prevent multiple submissions (but allow if pendingSubmission is true - means we're auto-submitting after login)
    if (isSubmitting || isAdPlaced) {
      return;
    }
    
    // If pendingSubmission is true, we're auto-submitting after login, so allow it
    if (pendingSubmission && !isLogin()) {
      return; // Still not logged in, wait
    }

    // Check login first - show login modal if not authenticated
    if (!isLogin()) {
      setPendingSubmission(true); // Mark that we're waiting for login to complete submission
      setShouldAutoSubmitLogin(true);
      toggleLoginModal(true);
      return;
    }

    // Reset pendingSubmission when we actually start posting
    if (pendingSubmission) {
      setPendingSubmission(false);
    }

    setIsSubmitting(true); // Set submitting state before validation (only when actually posting)

    const { title, desc, price, phone, country_code, slug, link, salaryMin, salaryMax } = AdListingDetails;

    const isValidSlug = /^[a-z0-9-]+$/.test(slug.trim());

    const cat = CurrentPath[CurrentPath.length - 1];
    const catId = cat?.id;

    if (!catId) {
      toast.error(t('selectCategory'))
      setIsSubmitting(false);
      return
    }

    if (!title.trim() || !desc.trim() || !phone) {
      toast.error(t('completeDetails'));
      setActiveTab(2);
      setIsSubmitting(false);
      return;
    }

    // Validate based on category type
    if (is_job_category) {
      // Salary fields are optional, but validate if provided
      if (salaryMin && salaryMin < 0) {
        toast.error(t('enterValidSalaryMin'));
        setActiveTab(2);
        setIsSubmitting(false);
        return;
      }

      if (salaryMax && salaryMax < 0) {
        toast.error(t('enterValidSalaryMax'));
        setActiveTab(2);
        setIsSubmitting(false);
        return;
      }

      if (salaryMin && salaryMax && Number(salaryMin) === Number(salaryMax)) {
        toast.error(t('salaryMinCannotBeEqualMax'));
        setActiveTab(2);
        setIsSubmitting(false);
        return
      }

      if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
        toast.error(t('salaryMinCannotBeGreaterThanMax'));
        setActiveTab(2);
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!isPriceOptional && !price) {
        toast.error(t('completeDetails'));
        setActiveTab(2);
        setIsSubmitting(false);
        return;
      }

      if (price && price < 0) {
        toast.error(t("enterValidPrice"));
        setActiveTab(2);
        setIsSubmitting(false);
        return;
      }
    }

    if (slug.trim() && !isValidSlug) {
      toast.error(t('addValidSlug'));
      setActiveTab(2);
      setIsSubmitting(false);
      return;
    }

    if (link && !isValidURL(link)) {
      toast.error(t('enterValidUrl'));
      setActiveTab(2);
      setIsSubmitting(false);
      return;
    }

    if (CustomFields.length !== 0 && !validateExtraDetails(CustomFields, extraDetails)) {
      setActiveTab(3);
      setIsSubmitting(false);
      return;
    }
    if (uploadedImages.length === 0) {
      toast.error(t('uploadMainPicture'));
      setActiveTab(4);
      setIsSubmitting(false);
      return
    }

    if (!Location?.country || !Location?.state || !Location?.city || !Location?.address) {
      toast.error(t('pleaseSelectCity'));
      setIsSubmitting(false);
      return
    }
    
    // All validations passed, post the ad
    postAd()
  }

  // Auto-submit after successful login/register
  useEffect(() => {
    if (IsLoggedIn && pendingSubmission && !IsLoginModalOpen && !IsRegisterModalOpen) {
      // User just logged in and we have a pending submission
      // Don't reset pendingSubmission yet - let handleFullSubmission handle it
      // Small delay to ensure modal is fully closed and state is updated
      setTimeout(() => {
        handleFullSubmission();
      }, 500);
    }
    // Reset pending submission if modal is closed without login
    if (!IsLoggedIn && pendingSubmission && !IsLoginModalOpen && !IsRegisterModalOpen) {
      setPendingSubmission(false);
      setIsSubmitting(false); // Reset submitting state if user closes modal without logging in
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [IsLoggedIn, pendingSubmission, IsLoginModalOpen, IsRegisterModalOpen]);

  useEffect(() => {
    if (!IsLoginModalOpen) {
      setShouldAutoSubmitLogin(false);
    }
  }, [IsLoginModalOpen]);

  const fetchMoreCategory = async (id) => {
    setIsLoadMoreCat(true)
    try {
      if (currentPage < lastPage) {
        const response = await categoryApi.getCategory({ page: `${currentPage + 1}`, category_id: lastItemId });
        const { data } = response.data;
        if (data && Array.isArray(data.data)) {
          // Translate categories before adding them
          const translatedData = translateCategories(data.data)
          setCurrenCategory(prev => [...prev, ...translatedData]);
          setCurrentPage(data?.data?.current_page); // Update the current page
          setLastPage(data?.data?.last_page); // Update the current page
        } else {
          console.error("Error: Data is not an array", data);
        }
      } else {
        return
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoadMoreCat(false)
    }
  }

  const handleTabClick = (tab) => {
    // On mobile: 0=title, 1=category, 2=details, 3=extra, 4=images, 5=location
    // On desktop: 1=category, 2=details, 3=extra, 4=images, 5=location
    if (isMobile && tab === 0) {
      setActiveTab(0);
    } else if (tab === 1) {
      // On mobile, category tab is only accessible if title is completed
      if (isMobile) {
        if (AdListingDetails.title?.trim()) {
          setActiveTab(1);
        } else {
          // Don't allow access to category tab without title
          return;
        }
      } else if (!DisabledTab.selectCategory) {
        setActiveTab(1);
      }
    } else if (tab === 2 && !DisabledTab.details) {
      setActiveTab(2);
    } else if (tab === 3 && !DisabledTab.extraDet) {
      setActiveTab(3);
    } else if (tab === 4 && !DisabledTab.img) {
      setActiveTab(4);
    } else if (tab === 5 && !DisabledTab.loc) {
      setActiveTab(5);
    }
    // Scroll to top on mobile when clicking tabs
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }

  const handleDeatilsBack = () => {
    setCustomFields([])
    setAdListingDetails({
      title: '',
      slug: '',
      desc: '',
      price: '',
      phone: '',
      country_code: '+1',
      link: '',
      salaryMin: '',
      salaryMax: '',
      notes: '',
    })
    if (activeTab !== 1) {
      setActiveTab(1);
      setDisabledTab({
        selectCategory: false, // Keep enabled on mobile
        details: true,
        extraDet: true,
        img: true,
        loc: true
      });
    }
    if (CurrentPath.length > 0) {
      CurrentPath.pop();
    }
    // Scroll to top on mobile
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }

  const ArrowIcon = CurrentLanguage?.rtl ? FaArrowRight : FaArrowLeft;

  // Get the title for the active tab
  const getActiveTabTitle = () => {
    if (activeTab === 0) return t("title");
    if (activeTab === 1) return t("selectCategory");
    if (activeTab === 2) return t("details");
    if (activeTab === 3) return t("extraDetails");
    if (activeTab === 4) return t("images");
    if (activeTab === 5) return t("location");
    return t("adListing");
  }

  return (
    <>
      {!isMobile && <BreadcrumbComponent title2={t("adListing")} />}
      <section className={`adListingSect container ${isMobile ? 'mobileAdListing' : ''}`}>
        {/* Mobile Header with Navigation */}
        {isMobile && (
          <div className="mobileAdHeader">
            <button 
              className="mobileNavBtn mobileNavBackBtn" 
              onClick={handleMobileBack}
            >
              {t("back")}
            </button>
            <span className="mobileAdTitle">{getActiveTabTitle()}</span>
            <button 
              className={`mobileNavBtn mobileNavNextBtn ${!canProceedToNext() || isSubmitting || isAdPlaced || pendingSubmission ? 'disabled' : ''}`}
              onClick={handleMobileNext}
              disabled={!canProceedToNext() || isSubmitting || isAdPlaced || pendingSubmission}
            >
              {activeTab === 5 ? (isSubmitting || isAdPlaced ? t("posting") : t("postNow")) : t("next")}
            </button>
          </div>
        )}

        {!isMobile && (
          <div className="row">
            <div className="col-12">
              <span className="heading">{t("adListing")}</span>
            </div>
          </div>
        )}

        <div className={`row tabsWrapper ${isMobile ? 'mobileTabsWrapper' : ''}`}>
          <div className="col-12">
            <div className={`tabsHeader ${isMobile ? 'mobileTabsHeader' : ''}`}>
              {isMobile && (
                <span
                  className={`tab ${activeTab === 0 ? "activeTab" : ""}`}
                  onClick={() => handleTabClick(0)}
                >
                  {t("title")}
                </span>
              )}
              <span
                className={`tab ${activeTab === 1 ? "activeTab" : ""}${(!isMobile && DisabledTab.selectCategory) || (isMobile && !AdListingDetails.title?.trim()) ? "PagArrowdisabled" : ""
                  }`}
                onClick={() => handleTabClick(1)}
              >
                {t("selectCategory")}
              </span>
              <span
                className={`tab ${activeTab === 2 ? "activeTab" : ""}${DisabledTab.details ? "PagArrowdisabled" : ""
                  }`}
                onClick={() => handleTabClick(2)}
              >
                {t("details")}
              </span>

              {CustomFields.length !== 0 && (
                <span
                  className={`tab ${activeTab === 3 ? "activeTab" : ""}${DisabledTab.extraDet ? "PagArrowdisabled" : ""
                    }`}
                  onClick={() => handleTabClick(3)}
                >
                  {t("extraDetails")}
                </span>
              )}

              <span
                className={`tab ${activeTab === 4 ? "activeTab" : ""}${DisabledTab.img ? "PagArrowdisabled" : ""
                  }`}
                onClick={() => handleTabClick(4)}
              >
                {t("images")}
              </span>
              <span
                className={`tab ${activeTab === 5 ? "activeTab" : ""}${DisabledTab.loc ? "PagArrowdisabled" : ""
                  }`}
                onClick={() => handleTabClick(5)}
              >
                {t("location")}
              </span>
            </div>
          </div>
          {(activeTab === 1 || (activeTab === 2 && !isMobile))
            ? CurrentPath.length > 0 && (
              <div className="col-12" style={{ display: 'none !important' }}>
                <div className="tabBreadcrumb">
                  <span className="title1">{t("selectedCategory")}</span>
                  <div className="selected_wrapper">
                    {CurrentPath.map((item, index) => (
                      <span
                        className="title2"
                        key={item.id}
                        onClick={() => handleSelectedTabClick(item?.id)}
                      >
                        {item.translated_name || item.name}
                        {index !== CurrentPath.length - 1 &&
                          CurrentPath.length > 1
                          ? ","
                          : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
            : null}
          <div className="col-12">
            <div className={`contentWrapper ${isMobile ? 'mobileContentWrapper' : ''}`}>
              <div className="row">
                {activeTab === 0 && isMobile && (
                  <ContentZero
                    AdListingDetails={AdListingDetails}
                    handleAdListingChange={handleAdListingChange}
                    handleTitleSubmit={handleTitleSubmit}
                  />
                )}
                {activeTab === 1 && (
                  <ContentOne
                    handleCategoryTabClick={handleCategoryTabClick}
                    CurrenCategory={CurrenCategory}
                    currentPage={currentPage}
                    lastPage={lastPage}
                    fetchMoreCategory={fetchMoreCategory}
                    IsLoading={IsLoading}
                    IsLoadMoreCat={IsLoadMoreCat}
                    CurrentPath={CurrentPath}
                  />
                )}
                {activeTab === 2 && (
                  <ContentTwo
                    AdListingDetails={AdListingDetails}
                    handleAdListingChange={handleAdListingChange}
                    handleDetailsSubmit={handleDetailsSubmit}
                    handleDeatilsBack={handleDeatilsBack}
                    systemSettingsData={systemSettingsData}
                    is_job_category={is_job_category}
                    isPriceOptional={isPriceOptional}
                    isMobile={isMobile}
                  />
                )}
                {activeTab === 3 && CustomFields.length !== 0 && (
                  <ContentThree
                    CustomFields={CustomFields}
                    extraDetails={extraDetails}
                    setExtraDetails={setExtraDetails}
                    submitExtraDetails={submitExtraDetails}
                    handleGoBack={handleGoBack}
                    filePreviews={filePreviews}
                    setFilePreviews={setFilePreviews}
                  />
                )}
                {activeTab === 4 && (
                  <ContentFour
                    setUploadedImages={setUploadedImages}
                    uploadedImages={uploadedImages}
                    OtherImages={OtherImages}
                    setOtherImages={setOtherImages}
                    handleImageSubmit={handleImageSubmit}
                    handleGoBack={handleGoBack}
                  />
                )}
                {activeTab === 5 && (
                  <ContentFive
                    getCurrentLocation={getCurrentLocation}
                    handleGoBack={handleGoBack}
                    Location={Location}
                    setLocation={setLocation}
                    handleFullSubmission={handleFullSubmission}
                    getLocationWithMap={getLocationWithMap}
                    Address={Address}
                    setAddress={setAddress}
                    isAdPlaced={isAdPlaced || isSubmitting || pendingSubmission}
                    isSubmitting={isSubmitting || isAdPlaced || pendingSubmission}
                    setCountryStore={setCountryStore}
                    CountryStore={CountryStore}
                    handleCountryScroll={handleCountryScroll}
                    StateStore={StateStore}
                    setStateStore={setStateStore}
                    handleStateScroll={handleStateScroll}
                    CityStore={CityStore}
                    setCityStore={setCityStore}
                    handleCityScroll={handleCityScroll}
                    AreaStore={AreaStore}
                    setAreaStore={setAreaStore}
                    handleAreaScroll={handleAreaScroll}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <AdSuccessfulModal
        IsAdSuccessfulModal={IsAdSuccessfulModal}
        OnHide={() => {
          setIsAdSuccessfulModal(false);
          setIsSubmitting(false);
          setPendingSubmission(false);
        }}
        CreatedAdSlug={CreatedAdSlug}
      />
      
      {/* Loading Overlay - Show only when actually posting (after auth) */}
      {(isSubmitting || isAdPlaced) && !pendingSubmission && (
        <div className="submission-loading-overlay">
          <div className="submission-loading-content">
            <div className="loader adListingLoader"></div>
            <p>{t("posting")}...</p>
          </div>
        </div>
      )}
      
      {/* Login and Register Modals - needed for mobile when header is hidden */}
      {isMobile && (
        <>
          <LoginModal
            IsLoginModalOpen={IsLoginModalOpen}
            setIsLoginModalOpen={toggleLoginModal}
            setIsRegisterModalOpen={toggleRegisterModal}
            IsMailSentOpen={IsMailSentOpen}
            setIsMailSentOpen={setIsMailSentOpen}
            prefilledPhone={AdListingDetails.phone}
            prefilledCountryCode={AdListingDetails.country_code}
            shouldAutoSubmitPhoneLogin={shouldAutoSubmitLogin}
            onAutoSubmitPhoneLoginHandled={() => setShouldAutoSubmitLogin(false)}
          />
          <RegisterModal
            IsRegisterModalOpen={IsRegisterModalOpen}
            setIsLoginModalOpen={toggleLoginModal}
            CloseRegisterModal={() => toggleRegisterModal(false)}
            setIsMailSentOpen={setIsMailSentOpen}
          />
          <MailSentSucessfully
            IsMailSentOpen={IsMailSentOpen}
            OnHide={() => setIsMailSentOpen(false)}
            IsLoginModalOpen={() => toggleLoginModal(true)}
          />
        </>
      )}

      {/* Exit Confirmation Modal - Mobile only */}
      {isMobile && (
        <Modal
          centered
          open={showExitConfirm}
          onCancel={handleCancelExit}
          footer={null}
          closeIcon={null}
          className="exit_confirm_modal"
          maskClosable={false}
          destroyOnHidden={true}
          transitionName=""
        >
          <div className="exit_confirm_content">
            <h3>{t("areYouSure")}</h3>
            <p>{t("exitAdListingWarning")}</p>
            <div className="exit_confirm_buttons">
              <button 
                className="cancel_btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelExit();
                }}
                type="button"
              >
                {t("cancel")}
              </button>
              <button 
                className="confirm_btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirmExit();
                }}
                type="button"
              >
                {t("yes")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default AdListing
