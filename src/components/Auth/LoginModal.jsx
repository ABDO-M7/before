import { Modal } from "antd";
import Link from "next/link";
import { MdClose, MdOutlineEmail, MdOutlineLocalPhone } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { useEffect, useRef, useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import firebaseApp from "@/utils/firebaseApp";
import toast from "react-hot-toast";
import { handleFirebaseAuthError, t } from "@/utils";
import { getOtpApi, userSignUpApi, verifyOtpApi, SEND_RESET_PASSWORD_EMAIL,RESET_PASSWORD,LOGIN } from "@/utils/api"; // Added SEND_RESET_PASSWORD_EMAIL
import Api from "@/api/AxiosInterceptors"; // Added Api
import { useSelector } from "react-redux";
import { Fcmtoken, settingsData } from "@/redux/reuducer/settingSlice";
import { loadUpdateData } from "../../redux/reuducer/authSlice";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useRouter } from "next/navigation";

const LoginModal = ({
  IsLoginModalOpen,
  setIsRegisterModalOpen,
  setIsLoginModalOpen,
  setIsMailSentOpen,
  invitationName,
  invitationCode,
  prefilledPhone,
  prefilledCountryCode,
  shouldAutoSubmitPhoneLogin = false,
  onAutoSubmitPhoneLoginHandled = () => {},
}) => {
  const router = useRouter();
  const emailInputRef = useRef(null);
  const numberInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const fetchFCM = useSelector(Fcmtoken);
  const systemSettingsData = useSelector(settingsData);
  const settings = systemSettingsData?.data;
  const otp_service_provider = settings?.otp_service_provider;
  const mobile_authentication = Number(settings?.mobile_authentication);
  const google_authentication = Number(settings?.google_authentication);
  const email_authentication = Number(settings?.email_authentication);
  const isDemoMode = settings?.demo_mode;
  const [IsLoginScreen, setIsLoginScreen] = useState(true);
  const [IsOTPScreen, setIsOTPScreen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [number, setNumber] = useState("");
  const [inputType, setInputType] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [resendOtpLoader, setResendOtpLoader] = useState(false);
  const [IsPasswordVisible, setIsPasswordVisible] = useState(false);
  const [IsLoginWithEmail, setIsLoginWithEmail] = useState((mobile_authentication === 0 && email_authentication === 1) ? true : false);
  const [resendTimer, setResendTimer] = useState(0);
  const autoSubmitTriggeredRef = useRef(false);

  const OnHide = async () => {
    setIsLoginModalOpen(false);
    setIsLoginScreen(true);
    setIsOTPScreen(false);
    setEmail("");
    setPassword("");
    setInputValue("");
    setInputType("");
    setNumber("");
    setOtp("");
    setResendTimer(0);
    await recaptchaClear();
  };

  // Remove any non-digit characters from the country code
  const countryCodeDigitsOnly = countryCode.replace(/\D/g, "");

  // Check if the entered number starts with the selected country code
  const startsWithCountryCode = number.startsWith(countryCodeDigitsOnly);

  // If the number starts with the country code, remove it
  const formattedNumber = startsWithCountryCode
    ? number.substring(countryCodeDigitsOnly.length)
    : number;

  useEffect(() => {
    // Only set demo mode values if prefilledPhone is not provided
    if (isDemoMode && IsLoginModalOpen && !prefilledPhone) {
      if (!IsLoginWithEmail) {
        setInputType("number");
        setInputValue("919876598765");
        setNumber("919876598765");
        setCountryCode("+91");
      } else {
        setInputType("email");
        setInputValue("");
        setNumber("");
      }
    }
  }, [isDemoMode, IsLoginModalOpen, IsLoginWithEmail, prefilledPhone]);

  // Pre-fill phone number when modal opens and prefilledPhone is provided
  useEffect(() => {
    if (IsLoginModalOpen && prefilledPhone && prefilledCountryCode) {
      // Format phone number for PhoneInput component
      // PhoneInput expects the number with country code prefix (without +)
      // Same format as used in ContentTwo: country_code.replace(/^\+/, "") + phone
      const countryCodeDigits = prefilledCountryCode.replace(/^\+/, '');
      const fullNumber = countryCodeDigits + prefilledPhone;
      
      setNumber(fullNumber);
      setCountryCode(prefilledCountryCode);
      setInputValue(fullNumber);
      setInputType("number");
      setIsLoginWithEmail(false); // Switch to mobile login if phone is provided
      
      // Small delay to ensure PhoneInput component is ready
      setTimeout(() => {
        if (numberInputRef.current) {
          numberInputRef.current.focus();
        }
      }, 100);
    }
  }, [IsLoginModalOpen, prefilledPhone, prefilledCountryCode]);

  useEffect(() => {
    if (IsLoginModalOpen) {
      requestAnimationFrame(() => {
        // Focus the email input when the login modal opens and email screen is active
        if (IsLoginWithEmail && emailInputRef.current) {
          emailInputRef.current.focus();
        } else if (!IsLoginWithEmail && numberInputRef.current) {
          numberInputRef.current.focus();
        }
        // Removed auto-focus for OTP screen - just show the form
      });
    }
  }, [IsLoginModalOpen, IsOTPScreen, IsLoginWithEmail]); // This will run whenever either IsLoginModalOpen or IsPasswordScreen changes

  // Timer countdown effect
  useEffect(() => {
    let intervalId;
    if (resendTimer > 0) {
      intervalId = setInterval(() => {
        setResendTimer(prevTimer => prevTimer - 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [resendTimer]);

  // const signin = async (email, password) => {
  //   try {
  //     const userCredential = await signInWithEmailAndPassword(
  //       auth,
  //       email,
  //       password
  //     );
  //     if (userCredential.length === 0) {
  //       toast.error(t("userNotFound"));
  //     } else {
  //       return userCredential;
  //     }
  //   } catch (error) {
  //     console.error("Error signing in:", error);
  //     throw error;
  //   }
  // };
const signin = async (email, password) => {
  try {
    const response = await Api.post("/login", {
      email,
      password,
    });

    const userCredential = response?.data;

    if (!userCredential || !userCredential.success || !userCredential.user) {
      toast.error(t("userNotFound"));
    } else {
      // تقدر تعتبر userCredential.user زي userCredential.user في Firebase
      return userCredential; // فيه token و user
    }
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

  const handleInputChange = (value, data) => {
    const emailRegexPattern =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const containsOnlyDigits = /^\d+$/.test(value);

    setInputValue(value);

    if (emailRegexPattern.test(value)) {
      setInputType("email");
      setEmail(value);
      setNumber("");
      setCountryCode("");
    } else if (containsOnlyDigits) {
      setInputType("number");
      setNumber(value);
      setCountryCode("+" + (data?.dialCode || ""));
    } else {
      setInputType("");
    }
  };
const Signin = async (e) => {
  e.preventDefault();
  try {
    if (!inputValue) {
      toast.error(t("emailRequired"));
      return;
    } else if (!/\S+@\S+\.\S+/.test(inputValue)) {
      toast.error(t("emailInvalid"));
      return;
    } else if (!password) {
      toast.error(t("passwordRequired"));
      return;
    } else if (password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    setShowLoader(true);

    const userCredential = await signin(email, password);
    const user = userCredential.user;

    if (user.email_verified_at) {
      try {
        const response = await userSignUpApi.userSignup({
          name: user?.name || "",
          email: user?.email,
          password: password, // إرسال كلمة المرور إلى الخادم
          firebase_id: user?.firebase_id || "", // still in DB structure
          fcm_id: fetchFCM || "",
          type: "email",
        });

        const data = response.data;
        
        loadUpdateData(data); // يمكن تكون redux أو context

        if (data.error === true) {
          toast.error(data.message);
        } else {
          toast.success(data.message);
        }

        OnHide();
      } catch (error) {
        console.error("Error saving user to backend:", error);
      }
    } else {
      toast.error(t("verifyEmailFirst"));
      // لا يوجد sendEmailVerification لأنك خارج Firebase
      // ممكن تبعت طلب لارسال ايميل من Laravel API هنا لو محتاج
    }
  } catch (error) {
    console.error("Login error:", error);
    toast.error(t("somethingWentWrong"));
  } finally {
    setShowLoader(false);
  }
};

// const Signin = async (e) => {
//   e.preventDefault();
//   try {
//     if (!inputValue) {
//       toast.error(t("emailRequired"));
//       return;
//     } else if (!/\S+@\S+\.\S+/.test(inputValue)) {
//       toast.error(t("emailInvalid"));
//       return;
//     } else if (!password) {
//       toast.error(t("passwordRequired"));
//       return;
//     } else if (password.length < 6) {
//       toast.error(t("passwordTooShort"));
//       return;
//     }

//     setShowLoader(true);

//     const userCredential = await signin(email, password);
//     const user = userCredential.user;

//     if (user.email_verified_at) {
//       try {
//         const response = await userSignUpApi.userSignup({
//           name: user?.name || "",
//           email: user?.email,
//           firebase_id: user?.firebase_id || "", // still in DB structure
//           fcm_id: fetchFCM || "",
//           type: "email",
//         });

//         const data = response.data;
//         loadUpdateData(data); // يمكن تكون redux أو context

//         if (data.error === true) {
//           toast.error(data.message);
//         } else {
//           toast.success(data.message);
//         }

//         OnHide();
//       } catch (error) {
//         console.error("Error saving user to backend:", error);
//       }
//     } else {
//       toast.error(t("verifyEmailFirst"));
//       // لا يوجد sendEmailVerification لأنك خارج Firebase
//       // ممكن تبعت طلب لارسال ايميل من Laravel API هنا لو محتاج
//     }
//   } catch (error) {
//     console.error("Login error:", error);
//     toast.error(t("somethingWentWrong"));
//   } finally {
//     setShowLoader(false);
//   }
// };

  const generateRecaptcha = () => {
    // Ensure auth object is properly initialized
    const auth = getAuth(firebaseApp);

    if (!window.recaptchaVerifier) {
      // Check if container element exists
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        console.error("Container element 'recaptcha-container' not found.");
        return null; // Return null if container element not found
      }

      try {
        // Clear any existing reCAPTCHA instance
        recaptchaContainer.innerHTML = "";

        // Initialize RecaptchaVerifier
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          }
        );
        return window.recaptchaVerifier;
      } catch (error) {
        console.error("Error initializing RecaptchaVerifier:", error.message);
        return null; // Return null if error occurs during initialization
      }
    }
    return window.recaptchaVerifier;
  };

  useEffect(() => {
    // Avoid initializing Firebase Auth / reCAPTCHA on page load.
    // Only do it when the modal is actually opened.
    if (!IsLoginModalOpen) return;

    generateRecaptcha();

    return () => {
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = "";
      }
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null; // Clear the recaptchaVerifier reference
      }
    };
  }, [IsLoginModalOpen]);

  const sendOTP = async () => {
    setShowLoader(true);
    const PhoneNumber = `${countryCode}${formattedNumber}`;
    if (otp_service_provider === 'twilio') {
      try {
        const response = await getOtpApi.getOtp({ phone: formattedNumber,country_code:countryCode });
        if (response?.data?.error === false) {
          toast.success(t("otpSentSuccess"));
          setResendTimer(60); // Start the 60-second timer
        } else {
          toast.error(t("failedToSendOtp"));
        }
      } catch (error) {
        console.error('error', error)
      } finally {
        setShowLoader(false);
      }
    }
    else {
      try {
        const auth = getAuth(firebaseApp);
        const appVerifier = generateRecaptcha();
        const confirmation = await signInWithPhoneNumber(
          auth,
          PhoneNumber,
          appVerifier
        );
        setConfirmationResult(confirmation);
        toast.success(t("otpSentSuccess"));
        setResendTimer(60); // Start the 60-second timer
        if (isDemoMode) {
          setOtp("123456");
        }
      } catch (error) {
        const errorCode = error.code;
        handleFirebaseAuthError(errorCode);
      } finally {
        setShowLoader(false);
        // Removed auto-focus - just show the form
      }
    }
  };

  const resendOtp = async (e) => {
    e.preventDefault();
    if (resendTimer > 0) return; // Prevent resend if timer is still active

    setResendOtpLoader(true);
    const PhoneNumber = `${countryCode}${formattedNumber}`;
    if (otp_service_provider === 'twilio') {
      try {
        const response = await getOtpApi.getOtp({ phone: formattedNumber,country_code:countryCode });
        if (response?.data?.error === false) {
          toast.success(t("otpSentSuccess"));
          setResendTimer(60); // Restart the 60-second timer
        } else {
          toast.error(t("failedToSendOtp"));
        }
      } catch (error) {
        console.error('error', error)
      } finally {
        setResendOtpLoader(false);
        // Removed auto-focus - just show the form
      }
    }
    else {
      try {
        const auth = getAuth(firebaseApp);
        const appVerifier = generateRecaptcha();
        const confirmation = await signInWithPhoneNumber(
          auth,
          PhoneNumber,
          appVerifier
        );
        setConfirmationResult(confirmation);
        toast.success(t("otpSentSuccess"));
        setResendTimer(60); // Restart the 60-second timer
      } catch (error) {
        const errorCode = error.code;
        handleFirebaseAuthError(errorCode);
      } finally {
        setResendOtpLoader(false);
        // Removed auto-focus - just show the form
      }
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (otp === "") {
      toast.error(t("otpmissing"));
      return;
    }
    setShowLoader(true);
    if (otp_service_provider === 'twilio') {
      const PhoneNumber = `${countryCode}${formattedNumber}`;
      try {
        const response = await verifyOtpApi.verifyOtp({  phone: formattedNumber,
          country_code: countryCode,
          otp: otp, });
        if (response?.data?.error === false) {
          loadUpdateData(response?.data);
          toast.success(response?.data?.message);
          if (response?.data?.data?.email === "" || response?.data?.data?.name === "") {
            router.push("/profile/edit-profile");
          }
          OnHide();
        } else {
          toast.error(response?.data?.message);
        }
      } catch (error) {
        console.error('error', error)
      } finally {
        setShowLoader(false);
      }
    }
    else {
      try {
        const result = await confirmationResult.confirm(otp);
        // Access user information from the result
        const user = result.user;
        const response = await userSignUpApi.userSignup({
          phone: formattedNumber,
          country_code: countryCode,
          firebase_id: user.uid, // Accessing UID directly from the user object
          fcm_id: fetchFCM ? fetchFCM : "",
          country_code: countryCode,
          type: "phone",
        });
        const data = response.data;
        loadUpdateData(data);
        toast.success(data.message);

        if (data?.data?.email === "" || response?.data?.name === "") {
          router.push("/profile/edit-profile");
        }

        OnHide();
      } catch (error) {
        console.error("Error:", error);
        const errorCode = error?.code;
        handleFirebaseAuthError(errorCode);
      } finally {
        setShowLoader(false);
      }
    }
  }


  const handleMobileSubmit = (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    // Perform phone number validation on the formatted number
    if (isValidPhoneNumber(`${countryCode}${formattedNumber}`)) {
      sendOTP();
      setIsOTPScreen(true);
      setIsLoginScreen(false);
    } else {
      // Show an error message indicating that the phone number is not valid
      toast.error(t("invalidPhoneNumber"));
    }
  };

  useEffect(() => {
    if (!shouldAutoSubmitPhoneLogin) {
      autoSubmitTriggeredRef.current = false;
    }
  }, [shouldAutoSubmitPhoneLogin]);

  useEffect(() => {
    if (
      shouldAutoSubmitPhoneLogin &&
      !autoSubmitTriggeredRef.current &&
      IsLoginModalOpen &&
      IsLoginScreen &&
      !IsLoginWithEmail &&
      !IsOTPScreen &&
      number &&
      countryCode &&
      mobile_authentication === 1 &&
      !showLoader
    ) {
      autoSubmitTriggeredRef.current = true;
      const timeout = setTimeout(() => {
        handleMobileSubmit();
        onAutoSubmitPhoneLoginHandled?.();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [
    shouldAutoSubmitPhoneLogin,
    IsLoginModalOpen,
    IsLoginScreen,
    IsLoginWithEmail,
    IsOTPScreen,
    number,
    countryCode,
    mobile_authentication,
    showLoader,
    handleMobileSubmit,
    onAutoSubmitPhoneLoginHandled,
  ]);

  useEffect(() => { }, [
    inputValue,
    inputType,
    IsOTPScreen,
    email,
    password,
    number,
  ]);

  useEffect(() => {
    if (inputValue === "" && email_authentication === 1) {
      setInputType("email");
      setNumber("");
    }
  }, [inputValue, inputType]);

  const togglePasswordVisible = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const handleShowLoginPassword = () => {
    setIsOTPScreen(false);
    setIsLoginScreen(true);
  };
  const CloseIcon = (
    <div className="close_icon_cont">
      <MdClose size={24} color="black" />
    </div>
  );
  const recaptchaClear = async () => {
    const recaptchaContainer = document.getElementById("recaptcha-container");
    if (recaptchaContainer) {
      recaptchaContainer.innerHTML = "";
    }
    if (window.recaptchaVerifier) {
      window?.recaptchaVerifier?.recaptcha?.reset();
    }
  };

const handleGoogleSignup = async () => {
  try {
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    // Use dynamic redirect URI based on current origin (works for both dev and production)
    const REDIRECT_URI = `${window.location.origin}/auth/callback`;

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=token&client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=profile email&prompt=select_account`;

    const popup = window.open(
      googleAuthUrl,
      "_blank",
      "width=500,height=600"
    );

    const waitForAccessToken = () => {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          try {
            const hash = popup?.location.hash;
            if (hash && hash.includes("access_token")) {
              const params = new URLSearchParams(hash.replace("#", ""));
              const accessToken = params.get("access_token");
              if (accessToken) {
                clearInterval(interval);
                popup?.close();
                resolve(accessToken);
              }
            }
          } catch (e) {
            // Ignore cross-origin errors
          }

          if (popup?.closed) {
            clearInterval(interval);
            reject(new Error("Popup closed by user"));
          }
        }, 500);
      });
    };

    const accessToken = await waitForAccessToken();

    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const user = await res.json();

    try {
      const response = await userSignUpApi.userSignup({
        name: user.name || "",
        email: user?.email,
        firebase_id: user.sub, // Google unique user ID
        fcm_id: fetchFCM ? fetchFCM : "",
        type: "google",
      });

      const data = response.data;
      loadUpdateData(data);

      if (data.error === true) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
      }

      OnHide(); // Close modal
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send data to the server");
    }
  } catch (error) {
    console.error("OAuth error:", error);
    toast.error("Google sign-in failed");
  }
};


const handleForgotModal = async (e) => {
  e.preventDefault();

  // Validate that the email field is not empty
  if (!email) {
    toast.error(t("emailRequired"));
    return;
  }

  // Validate that the email format is correct
  if (!/\S+@\S+\.\S+/.test(email)) {
    toast.error(t("emailInvalid"));
    return;
  }

  try {
    // Show loading indicator
    setShowLoader(true);

    // Send POST request to Laravel API to trigger password reset email
    const response = await Api.post(SEND_RESET_PASSWORD_EMAIL, { email });
    
    const data = response.data;

    // Check if the request was successful and no error was returned
    if (response.status === 200 && !data.error) {
      toast.success(t("resetPassword"));
      setIsMailSentOpen(true);
      setIsLoginScreen(true);
    } else {
      toast.error(data.message || t("failedToSendResetEmail"));
    }
  } catch (error) {
    // Log and display error if the request fails
    console.error("Error sending password reset email:", error);
    toast.error(t("failedToSendResetEmail"));
  } finally {
    // Hide loading indicator
    setShowLoader(false);
  }
};

  const handleCreateAnAccount = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  // Format phone number with spaces for display (with country code)
  const formatPhoneNumberForDisplay = (phoneNumber, countryCode) => {
    if (!phoneNumber) return "";
    // Remove any non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    // Format with spaces for readability
    let formattedNumber = "";
    if (digitsOnly.length <= 3) {
      formattedNumber = digitsOnly;
    } else if (digitsOnly.length <= 6) {
      formattedNumber = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
    } else if (digitsOnly.length === 10) {
      // Format as 4-2-4 for 10-digit numbers
      formattedNumber = `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 6)} ${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length === 11) {
      // Format as 3-3-4 for 11-digit numbers
      formattedNumber = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
    } else {
      // For other lengths, use a flexible grouping
      if (digitsOnly.length <= 9) {
        formattedNumber = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
      } else {
        formattedNumber = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6, 10)} ${digitsOnly.slice(10)}`;
      }
    }
    // Add country code if provided
    return countryCode ? `${countryCode} ${formattedNumber}` : formattedNumber;
  };

  return (
    <>
      <Modal
        centered
        open={IsLoginModalOpen}
        closeIcon={CloseIcon}
        colorIconHover="transparent"
        className="ant_register_modal"
        zIndex={1100}
        styles={{ wrapper: { zIndex: 1100 } }}
        onCancel={OnHide}
        footer={null}
        maskClosable={false}
      >
        {IsLoginScreen && (
          <div className="register_modal">
            <div className="reg_modal_header">
              {/* Show invitation message if available */}
              {invitationName && (
                <div className="invited_user_name">
                  You are invited by: <strong>{invitationName}</strong>
                </div>
              )}
              <h1 className="reg_modal_title">
                {t("loginTo")}
                <span className="brand_name"> {settings?.company_name}</span>
              </h1>

              {/* I hide it from abo hussien cause the login form work as same as register form */}
              {/* <p className="signin_redirect">
                {t("newto")} {settings?.company_name}?{" "}
                <span
                  className="main_signin_redirect"
                  onClick={handleCreateAnAccount}
                >
                  {t("createAccount")}
                </span>
              </p> */}
            </div>

            {!(
              mobile_authentication === 0 &&
              email_authentication === 0 &&
              google_authentication === 1
            ) && (
                <form
                  className="auth_form"
                  onSubmit={IsLoginWithEmail ? Signin : handleMobileSubmit}
                >
                  <div className="auth_in_cont">
                    {mobile_authentication === 1 &&
                      email_authentication === 1 && (
                        <>
                          {IsLoginWithEmail ? (
                            <div className="auth_form">
                              <div className="auth_in_cont">
                                <label htmlFor="email" className="auth_label">
                                  {t("email")}
                                </label>
                                <input
                                  type="text"
                                  className="auth_input"
                                  placeholder={t("enterEmail")}
                                  value={inputValue}
                                  onChange={(e) =>
                                    handleInputChange(e.target.value, {})
                                  }
                                  required
                                  ref={emailInputRef}
                                />
                              </div>

                              <div className="auth_in_cont">
                                <label htmlFor="password" className="auth_label">
                                  {t("password")}
                                </label>
                                <div className="password_cont">
                                  <input
                                    type={IsPasswordVisible ? "text" : "password"}
                                    className="auth_input"
                                    placeholder={t("enterPassword")}
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                  />
                                  <div
                                    className="pass_eye"
                                    onClick={togglePasswordVisible}
                                  >
                                    {IsPasswordVisible ? (
                                      <FaRegEye size={20} />
                                    ) : (
                                      <FaRegEyeSlash size={20} />
                                    )}
                                  </div>
                                </div>
                                <p
                                  className="frgt_pass"
                                  onClick={handleForgotModal}
                                >
                                  {t("forgtPassword")}
                                </p>
                              </div>

                              <button
                                type="submit"
                                disabled={showLoader}
                                className="verf_email_add_btn"
                              >
                                {showLoader ? (
                                  <div className="loader-container-otp">
                                    <div className="loader-otp"></div>
                                  </div>
                                ) : (
                                  t("signIn")
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="auth_form">
                              <div className="auth_in_cont">
                                <label htmlFor="email" className="auth_label">
                                  {t("loginWithMobile")}
                                </label>
                                <PhoneInput
                                  separateDialCode
                                  enableSearch
                                  countryCodeEditable={false}
                                  dropdownStyle={{ direction: "ltr" }}
                                  country={
                                    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY
                                  }
                                  value={number}
                                  onChange={(phone, data) =>
                                    handleInputChange(phone, data)
                                  }
                                  onCountryChange={(code) => setCountryCode(code)}
                                  inputProps={{
                                    name: "phone",
                                    required: true,
                                    autoFocus: true,
                                    ref: numberInputRef,
                                  }}
                                  // enableLongNumbers
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={showLoader}
                                className="verf_email_add_btn"
                              >
                                {showLoader ? (
                                  <div className="loader-container-otp">
                                    <div className="loader-otp"></div>
                                  </div>
                                ) : (
                                  t("continue")
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}

                    {email_authentication === 1 &&
                      mobile_authentication === 0 && (
                        <div className="auth_form">
                          <div className="auth_in_cont">
                            <label htmlFor="email" className="auth_label">
                              {t("email")}
                            </label>
                            <input
                              type="text"
                              className="auth_input"
                              placeholder={t("enterEmail")}
                              value={inputValue}
                              onChange={(e) =>
                                handleInputChange(e.target.value, {})
                              }
                              required
                              ref={emailInputRef}
                            />
                          </div>

                          <div className="auth_in_cont">
                            <label htmlFor="password" className="auth_label">
                              {t("password")}
                            </label>
                            <div className="password_cont">
                              <input
                                type={IsPasswordVisible ? "text" : "password"}
                                className="auth_input"
                                placeholder={t("enterPassword")}
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                              <div
                                className="pass_eye"
                                onClick={togglePasswordVisible}
                              >
                                {IsPasswordVisible ? (
                                  <FaRegEye size={20} />
                                ) : (
                                  <FaRegEyeSlash size={20} />
                                )}
                              </div>
                            </div>
                            <p className="frgt_pass" onClick={handleForgotModal}>
                              {t("forgtPassword")}
                            </p>
                          </div>

                          <button
                            type="submit"
                            disabled={showLoader}
                            className="verf_email_add_btn"
                          >
                            {showLoader ? (
                              <div className="loader-container-otp">
                                <div className="loader-otp"></div>
                              </div>
                            ) : (
                              t("signIn")
                            )}
                          </button>
                        </div>
                      )}
                    {mobile_authentication === 1 &&
                      email_authentication === 0 && (
                        <div className="auth_form">
                          <div className="auth_in_cont">
                            <label htmlFor="email" className="auth_label">
                              {t("loginWithMobile")}
                            </label>
                            <PhoneInput
                              separateDialCode
                              enableSearch
                              countryCodeEditable={false}
                              dropdownStyle={{ direction: "ltr" }}
                              
                              country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY}
                              value={number}
                              onChange={(phone, data) =>
                                handleInputChange(phone, data)
                              }
                              onCountryChange={(code) => setCountryCode(code)}
                              inputProps={{
                                name: "phone",
                                required: true,
                                autoFocus: true,
                                ref: numberInputRef,
                              }}
                              enableLongNumbers
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={showLoader}
                            className="verf_email_add_btn"
                          >
                            {showLoader ? (
                              <div className="loader-container-otp">
                                <div className="loader-otp"></div>
                              </div>
                            ) : (
                              t("continue")
                            )}
                          </button>
                        </div>
                      )}
                  </div>
                </form>
              )}

            {!(
              mobile_authentication === 0 &&
              email_authentication === 0 &&
              google_authentication === 1
            ) &&
              google_authentication === 1 && (
                <div className="signup_with_cont">
                  <hr className="w-full" />
                  <p>{t("orSignInWith")}</p>
                  <hr className="w-full" />
                </div>
              )}

            <div className="continueMethodCont">
              {google_authentication === 1 && (
                <button
                  className="reg_with_google_btn"
                  onClick={handleGoogleSignup}
                >
                  <FcGoogle size={24} />
                  {t("google")}
                </button>
              )}

              {IsLoginWithEmail && mobile_authentication === 1 ? (
                <button
                  className="reg_with_google_btn"
                  onClick={() => setIsLoginWithEmail(false)}
                >
                  <MdOutlineLocalPhone size={24} />
                  {t("continueWithMobile")}
                </button>
              ) : (
                !IsLoginWithEmail &&
                email_authentication === 1 && (
                  <button
                    className="reg_with_google_btn"
                    onClick={() => setIsLoginWithEmail(true)}
                  >
                    <MdOutlineEmail size={24} />
                    {t("continueWithEmail")}
                  </button>
                )
              )}
            </div>
            <div className="auth_modal_footer">
              {t("agreeSignIn")} {settings?.company_name} <br />
              <Link
                href="/terms-and-condition"
                className="link_brand_name"
                onClick={OnHide}
              >
                {t("termsService")}
              </Link>{" "}
              {t("and")}{" "}
              <Link
                href="/privacy-policy"
                className="link_brand_name"
                onClick={OnHide}
              >
                {t("privacyPolicy")}
              </Link>
            </div>
          </div>
        )}

        {IsOTPScreen && (
          <>
            <div className="register_modal">
              <div className="reg_modal_header">
                <h1 className="reg_modal_title">{t("verifyOtp")}</h1>
                <p className="signin_redirect">
                  {t("sentTo")}<br></br>{" "}
                  <span dir="ltr" style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>
                    {formatPhoneNumberForDisplay(formattedNumber, countryCode)}
                  </span>{" "}
                  <span
                    className="main_signin_redirect"
                    onClick={handleShowLoginPassword}
                  >
                    {t("change")}
                  </span>
                </p>
              </div>
              <form className="auth_form">
                <div className="auth_in_cont">
                  <label htmlFor="otp" className="auth_label">
                    {t("otp")}
                  </label>
                  <input
                    type="text"
                    className="auth_input"
                    placeholder={t("enterOtp")}
                    id="otp"
                    name="otp"
                    value={otp}
                    maxLength="6"
                    onChange={(e) => setOtp(e.target.value)}
                    ref={otpInputRef}
                    autoFocus={false}
                  />
                </div>
                <>
                  <button
                    type="submit"
                    disabled={showLoader}
                    className="verf_email_add_btn"
                    onClick={verifyOTP}
                  >
                    {showLoader ? (
                      <div className="loader-container-otp">
                        <div className="loader-otp"></div>
                      </div>
                    ) : (
                      t("verify")
                    )}
                  </button>

                  {resendOtpLoader ? (
                    <div className="loader-container-otp">
                      <div className="loader-otp"></div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="resend_otp_btn"
                      onClick={resendOtp}
                      disabled={resendTimer > 0}
                      style={{ opacity: resendTimer > 0 ? 0.7 : 1, cursor: resendTimer > 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {resendTimer > 0 ?
                        `${t('resendOtp')} (${resendTimer}s)` :
                        t("resendOtp")
                      }
                    </button>
                  )}
                </>
              </form>
            </div>
          </>
        )}
      </Modal>
      <div id="recaptcha-container"></div>
    </>
  );
};

export default LoginModal;
