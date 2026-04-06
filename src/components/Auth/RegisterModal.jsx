import { Modal } from "antd";
import Link from "next/link";
import { MdClose } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { useEffect, useRef, useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import firebaseApp from "@/utils/firebaseApp";
import Api from "@/api/AxiosInterceptors"; // Added Api
import toast from "@/utils/toast";
import { handleFirebaseAuthError, t } from "@/utils";
import { getOtpApi, userSignUpApi, verifyOtpApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { Fcmtoken, settingsData } from "@/redux/reuducer/settingSlice";
import { loadUpdateData } from "../../redux/reuducer/authSlice";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useRouter } from "next/navigation";

const RegisterModal = ({
  IsRegisterModalOpen,
  CloseRegisterModal,
  setIsLoginModalOpen,
  setIsMailSentOpen,
  invitationName,
  invitationCode
}) => {
  const router = useRouter();
  const emailInputRef = useRef(null);
  const usernameInputRef = useRef(null);
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
  const [IsPasswordScreen, setIsPasswordScreen] = useState(false);
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
  const [username, setUsername] = useState("");
  const [resendTimer, setResendTimer] = useState(0);


  const OnHide = async () => {
    setIsLoginScreen(true);
    setIsPasswordScreen(false);
    setIsOTPScreen(false);
    setEmail("");
    setPassword("");
    setInputValue("");
    setUsername("");
    setInputType("");
    setNumber("");
    setOtp("");
    setResendTimer(0);
    CloseRegisterModal();
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
    if (IsRegisterModalOpen) {
      requestAnimationFrame(() => {
        if (!IsPasswordScreen && emailInputRef.current) {
          emailInputRef.current.focus();
        } else if (IsPasswordScreen && usernameInputRef.current) {
          usernameInputRef.current.focus();
        } else if (IsOTPScreen && otpInputRef.current) {
          otpInputRef.current.focus();
        }
      });
    }
  }, [IsPasswordScreen, IsRegisterModalOpen, IsOTPScreen]);

  // Timer countdown effect
  useEffect(() => {
    let intervalId;
    if (resendTimer > 0) {
      intervalId = setInterval(() => {
        setResendTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [resendTimer]);

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
  // const Signin = async (e) => {
  //   e.preventDefault();

  //   if (!email) {
  //     toast.error(t("emailRequired"));
  //     return;
  //   } else if (!/\S+@\S+\.\S+/.test(email)) {
  //     toast.error(t("emailInvalid"));
  //     return;
  //   }
  //   if (username?.trim() === "") {
  //     toast.error(t("usernameRequired"));
  //     return;
  //   }
  //   if (!password) {
  //     toast.error(t("passwordRequired"));
  //     return;
  //   } else if (password.length < 6) {
  //     toast.error(t("passwordTooShort"));
  //     return;
  //   }
  //   try {
  //     setShowLoader(true);
  //     const userCredential = await createUserWithEmailAndPassword(
  //       auth,
  //       email,
  //       password
  //     );
  //     const user = userCredential.user;
  //     await sendEmailVerification(user);
  //     try {
  //       await userSignUpApi.userSignup({
  //         name: username ? username : "",
  //         email: email ? email : "",
  //         firebase_id: user?.uid,
  //         type: "email",
  //         registration: true,
  //       });
  //       OnHide();
  //       setIsMailSentOpen(true);
  //     } catch (error) {
  //       console.log("error", error);
  //     }
  //   } catch (error) {
  //     const errorCode = error.code;
  //     handleFirebaseAuthError(errorCode);
  //   } finally {
  //     setShowLoader(false);
  //   }
  // };

  const Signin = async (e) => {
    e.preventDefault();

    // التحقق من صحة الإدخال
    if (!email) {
      toast.error(t("emailRequired"));
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error(t("emailInvalid"));
      return;
    }

    if (username?.trim() === "") {
      toast.error(t("usernameRequired"));
      return;
    }

    if (!password) {
      toast.error(t("passwordRequired"));
      return;
    } else if (password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    try {
      setShowLoader(true);
      // إرسال البيانات لـ Laravel API
      const response = await Api.post("/user-signup", {
        name: username,
        email: email,
        password: password,
        type: "email",
        registration: true,
        firebase_id: Math.floor(Math.random() * (9000000 - 10000 + 1)) + 10000,
        invitationCode: invitationCode || null, // <--- هنا أضفنا التوكن
      });

      const data = response.data;

      if (data?.error === true) {
        toast.error(data.message || t("signupFailed"));
      } else {
        toast.success(data.message || t("checkYourEmail"));
        OnHide();
        setIsMailSentOpen(true);
      }
    } catch (error) {
      console.error("Signup Error:", error);
      toast.error(t("signupFailed"));
    } finally {
      setShowLoader(false);
    }
  };

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
    if (!IsRegisterModalOpen) return;

    generateRecaptcha();

    return () => {
      // Clean up recaptcha container and verifier when component unmounts
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = "";
      }
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null; // Clear the recaptchaVerifier reference
      }
    };
  }, [IsRegisterModalOpen]);

  const sendOTP = async () => {
    setShowLoader(true);
    const PhoneNumber = `${countryCode}${formattedNumber}`;
    if (otp_service_provider === "twilio") {
      try {
        const response = await getOtpApi.getOtp({ phone: formattedNumber,country_code:countryCode });
        if (response?.data?.error === false) {
          toast.success(t("otpSentSuccess"));
          setResendTimer(60); // Start the 60-second timer
        } else {
          toast.error(t("failedToSendOtp"));
        }
      } catch (error) {
        console.error("error", error);
      } finally {
        setShowLoader(false);
      }
    } else {
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
        console.log(error);
        const errorCode = error.code;
        handleFirebaseAuthError(errorCode);
      } finally {
        setShowLoader(false);
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
      }
    }
  };

  const resendOtp = async (e) => {
    e.preventDefault();
    if (resendTimer > 0) return; // Prevent resend if timer is still active

    setResendOtpLoader(true);
    const PhoneNumber = `${countryCode}${formattedNumber}`;
    if (otp_service_provider === "twilio") {
      try {
        const response = await getOtpApi.getOtp({ phone: formattedNumber,country_code:countryCode });
        if (response?.data?.error === false) {
          toast.success(t("otpSentSuccess"));
          setResendTimer(60); // Restart the 60-second timer
        } else {
          toast.error(t("failedToSendOtp"));
        }
      } catch (error) {
        console.error("error", error);
      } finally {
        setResendOtpLoader(false);
        otpInputRef?.current?.focus();
      }
    } else {
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
        console.log(error);
        const errorCode = error.code;
        handleFirebaseAuthError(errorCode);
      } finally {
        setResendOtpLoader(false);
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
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
    if (otp_service_provider === "twilio") {
      const PhoneNumber = `${countryCode}${formattedNumber}`;
      try {
        const response = await verifyOtpApi.verifyOtp({
          phone: formattedNumber,
          country_code: countryCode,
          otp: otp,
        });
        if (response?.data?.error === false) {
          loadUpdateData(response?.data);
          toast.success(response?.data?.message);
          if (
            response?.data?.data?.email === "" ||
            response?.data?.data?.name === ""
          ) {
            router.push("/profile/edit-profile");
          }
          OnHide();
        } else {
          toast.error(response?.data?.message);
        }
      } catch (error) {
        console.error("error", error);
      } finally {
        setShowLoader(false);
      }
    } else {
      try {
        const result = await confirmationResult.confirm(otp);
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
  };

 const handleLoginSubmit = async (e) => {
  e.preventDefault();
  setShowLoader(true);

  const value =
    inputType === "email" ? email : `${countryCode}${formattedNumber}`;

  try {
    // const response = await Api.post("/check-user-exists", {
    //   type: inputType, // "email" or "number"
    //   value,
    //   phone: formattedNumber || null,
    //   country_code: countryCode || null,
    // });

    // if (!response.data.exists) {
    //   // ✅ المستخدم غير موجود بالفعل → نكمل خطوات التسجيل
    //   if (inputType === "email") {
    //     setIsPasswordScreen(true);
    //     setIsLoginScreen(false);
    //   } else if (inputType === "number") {
    //     sendOTP();
    //     setIsOTPScreen(true);
    //     setIsLoginScreen(false);
    //   }
    // } else {
    //   // ❌ المستخدم موجود بالفعل → نظهر رسالة خطأ
    //   if (inputType === "email") {
    //     toast.error(t("emailAlreadyExists"));
    //   } else {
    //     toast.error(t("phoneAlreadyExists"));
    //   }
    // }
     if (inputType === "email") {
        setIsPasswordScreen(true);
        setIsLoginScreen(false);
      } else if (inputType === "number") {
        sendOTP();
        setIsOTPScreen(true);
        setIsLoginScreen(false);
      }
  } catch (error) {
    toast.error(t("somethingWentWrong"));
  } finally {
    setShowLoader(false);
  }
};


  useEffect(() => {}, [
    inputValue,
    inputType,
    IsPasswordScreen,
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
    setIsPasswordScreen(false);
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

  // const handleGoogleSignup = async () => {
  //     const provider = new GoogleAuthProvider();
  //     try {
  //         const response = await signInWithPopup(auth, provider);
  //         const user = response.user
  //         try {
  //             const response = await userSignUpApi.userSignup({
  //                 name: user.displayName ? user.displayName : "",
  //                 email: user?.email,
  //                 firebase_id: user.uid, // Accessing UID directly from the user object
  //                 fcm_id: fetchFCM ? fetchFCM : "",
  //                 type: "google"
  //             });

  //             const data = response.data;
  //             loadUpdateData(data)
  //             if (data.error === true) {
  //                 toast.error(data.message);
  //             }
  //             else {
  //                 toast.success(data.message);
  //             }
  //             OnHide();

  //         } catch (error) {
  //             console.error("Error:", error);
  //         }
  //     } catch (error) {
  //         const errorCode = error.code;
  //         handleFirebaseAuthError(errorCode);
  //     }
  // };

  // const handleGoogleSignup = () => {
  //     const authWindow = window.open(
  //         `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, // أو /api/auth/google حسب Laravel
  //         '_blank',
  //         'width=500,height=600'
  //     );

  //     const receiveMessage = (event) => {
  //         // تحقق إن الرسالة جاية من Laravel API
  //         if (event.origin !== "https://app.arablaza.com") return;

  //         const { token, user, error } = event.data;

  //         if (error) {
  //             toast.error("فشل تسجيل الدخول: " + error);
  //             console.error("Login Error:", event.data.details);
  //         } else {
  //             localStorage.setItem('token', token);
  //             loadUpdateData(user);
  //             toast.success("تم تسجيل الدخول بنجاح 🎉");
  //             OnHide();
  //         }

  //         window.removeEventListener("message", receiveMessage);
  //     };

  //     window.addEventListener("message", receiveMessage, false);
  // };

  const handleGoogleSignup = async () => {
    try {
      // 1. Google OAuth data
      const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      // Use dynamic redirect URI based on current origin (works for both dev and production)
      const REDIRECT_URI = `${window.location.origin}/auth/callback`;

      // 2. Google OAuth URL
      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `response_type=token&client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=profile email&prompt=select_account`;

      // 3. Open OAuth popup window
      const popup = window.open(
        googleAuthUrl,
        "_blank",
        "width=500,height=600"
      );

      // 4. Wait for access_token from popup window
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
              // Ignore cross-origin access errors
            }

            if (popup?.closed) {
              clearInterval(interval);
              reject(new Error("Popup closed by user"));
            }
          }, 500);
        });
      };

      const accessToken = await waitForAccessToken();

      // 5. Fetch user info from Google
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const user = await res.json(); // Contains name, email, sub, picture

      // 6. Send user data to Laravel API
      try {
        const response = await userSignUpApi.userSignup({
          name: user.name || "",
          email: user?.email,
          firebase_id: user.sub, // Google unique user ID
          fcm_id: fetchFCM ? fetchFCM : "",
          type: "google",
          invitationCode: invitationCode || null, // <--- هنا أضفنا التوكن
        });

        const data = response.data;
        loadUpdateData(data);

        if (data.error === true) {
          toast.error(data.message);
        } else {
          toast.success(data.message);
        }

        OnHide(); // Hide modal (if applicable)
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to send data to the server");
      }
    } catch (error) {
      console.error("OAuth error:", error);
      toast.error("Google sign-in failed");
    }
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

  const handleLoginClick = () => {
    CloseRegisterModal();
    setIsLoginModalOpen(true);
  };

  return (
    <>
      <Modal
        centered
        open={IsRegisterModalOpen}
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
                {/* هنا نضيف اسم المدعو لو موجود */}
    {invitationName && (
      <div className="invited_user_name">
        You are invited by: <strong>{invitationName}</strong>
      </div>
    )}
              <h1 className="reg_modal_title">
                {t("welcomeTo")}
                <span className="brand_name"> {settings?.company_name}</span>
              </h1>
              <p className="signin_redirect">
                {t("haveAccount")}{" "}
                <span
                  className="main_signin_redirect"
                  onClick={handleLoginClick}
                >
                  {t("logIn")}
                </span>
              </p>
            </div>

            {!(
              mobile_authentication === 0 &&
              email_authentication === 0 &&
              google_authentication === 1
            ) && (
              <form className="auth_form" onSubmit={handleLoginSubmit}>
                <div className="auth_in_cont">
                  {mobile_authentication === 1 &&
                    email_authentication === 1 && (
                      <>
                        <label htmlFor="email" className="auth_label">
                          {t("emailOrPhoneNumber")}
                        </label>
                        {inputType === "number" ? (
                          <PhoneInput
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
                            }}
                            enableLongNumbers
                          />
                        ) : (
                          <input
                            type="text"
                            className="auth_input"
                            placeholder={t("enterEmailPhone")}
                            value={inputValue}
                            onChange={(e) =>
                              handleInputChange(e.target.value, {})
                            }
                            required
                            ref={emailInputRef}
                          />
                        )}
                      </>
                    )}

                  {email_authentication === 1 &&
                    mobile_authentication === 0 && (
                      <>
                        <label htmlFor="email" className="auth_label">
                          {t("email")}
                        </label>
                        <input
                          type="email"
                          className="auth_input"
                          placeholder={t("enterEmail")}
                          value={inputValue}
                          onChange={(e) => handleInputChange(e.target.value)}
                          required
                        />
                      </>
                    )}

                  {mobile_authentication === 1 &&
                    email_authentication === 0 && (
                      <>
                        <label htmlFor="phone" className="auth_label">
                          {t("phoneNumber")}
                        </label>
                        <PhoneInput
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
                          }}
                        />
                      </>
                    )}
                </div>

                {!(
                  mobile_authentication === 0 &&
                  email_authentication === 0 &&
                  google_authentication === 1
                ) && (
                  <button type="submit" className="verf_email_add_btn">
                    {showLoader ? (
                      <div className="loader-container-otp">
                        <div className="loader-otp"></div>
                      </div>
                    ) : (
                      <span>{t("continue")}</span>
                    )}
                  </button>
                )}
              </form>
            )}

            {!(
              mobile_authentication === 0 &&
              email_authentication === 0 &&
              google_authentication === 1
            ) &&
              google_authentication === 1 && (
                <div className="signup_with_cont">
                  <hr />
                  <p>{t("orSignInWith")}</p>
                  <hr />
                </div>
              )}

            {google_authentication === 1 && (
              <button
                className="reg_with_google_btn"
                onClick={handleGoogleSignup}
              >
                <FcGoogle size={24} />
                {t("google")}
              </button>
            )}

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

        {IsPasswordScreen && (
          <div className="register_modal">
            <div className="reg_modal_header">
              <h1 className="reg_modal_title">{t("signUpWithEmail")}</h1>
              <p className="signin_redirect">
                {email}{" "}
                <span
                  className="main_signin_redirect"
                  onClick={handleShowLoginPassword}
                >
                  {t("change")}
                </span>
              </p>
            </div>
            <form className="auth_form" onSubmit={Signin}>
              <div className="auth_in_cont">
                <label htmlFor="username" className="auth_label">
                  {t("username")}
                </label>
                <input
                  type="text"
                  ref={usernameInputRef}
                  placeholder={t("typeUsername")}
                  className="auth_input"
                  name="username"
                  required
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
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
                  <div className="pass_eye" onClick={togglePasswordVisible}>
                    {IsPasswordVisible ? (
                      <FaRegEye size={20} />
                    ) : (
                      <FaRegEyeSlash size={20} />
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="verf_email_add_btn">
                {showLoader ? (
                  <div className="loader-container-otp">
                    <div className="loader-otp"></div>
                  </div>
                ) : (
                  <span>{t("verifyEmail")}</span>
                )}
              </button>
            </form>
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
                  />
                </div>
                <>
                  <button
                    type="submit"
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

                  <button
                    type="submit"
                    className="resend_otp_btn"
                    onClick={resendOtp}
                    disabled={resendTimer > 0}
                    style={{
                      opacity: resendTimer > 0 ? 0.7 : 1,
                      cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    {resendOtpLoader ? (
                      <div className="loader-container-otp">
                        <div className="loader-otp"></div>
                      </div>
                    ) : resendTimer > 0 ? (
                      `${t("resendOtp")} (${resendTimer}s)`
                    ) : (
                      t("resendOtp")
                    )}
                  </button>
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

export default RegisterModal;
