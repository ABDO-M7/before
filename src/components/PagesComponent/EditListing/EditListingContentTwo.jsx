"use client";
import React, { useState } from "react";
import { t } from "@/utils";
import PhoneInput from "react-phone-input-2";

const ContentTwo = ({
  AdListingDetails,
  handleAdListingChange,
  handleDetailsSubmit,
  systemSettingsData,
  is_job_category,
  isPriceOptional,
}) => {
  const [email, setEmail] = useState("");
  const currencyPosition = systemSettingsData.data.currency_symbol_position;
  const currencySymbol = systemSettingsData.data.currency_symbol;
  const [inputValue, setInputValue] = useState("");
  const [inputType, setInputType] = useState("");
  const [number, setNumber] = useState("");
  const [countryCode, setCountryCode] = useState("");
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

  const placeholderLabel =
    currencyPosition === "right"
      ? `00 ${currencySymbol}`
      : `${currencySymbol} 00`;

  function inpNum(e) {
    e = e || window.event;
    var charCode = typeof e.which == "undefined" ? e.keyCode : e.which;
    var charStr = String.fromCharCode(charCode);
    if (!charStr.match(/^[0-9]+$/)) {
      e.preventDefault();
    }
  }

  return (
    <>
      <div className="col-12">
        <div className="row formWrapper">
          <div className="col-12">
            <label htmlFor="title" className="auth_label">
              {t("title")}
            </label>
            <input
              placeholder={t("enterTitle")}
              className={`${AdListingDetails.title ? "bg" : ""}`}
              value={AdListingDetails.title}
              type="text"
              name="title"
              onChange={handleAdListingChange}
              required
            />
          </div>

          <div className="col-12">
            <label className="auth_label" htmlFor="description">
              {t("description")}
            </label>
            <textarea
              placeholder={t("enterDescription")}
              name="desc"
              className={`${AdListingDetails.desc ? "bg" : ""}`}
              value={AdListingDetails.desc}
              onChange={handleAdListingChange}
              required
            />
          </div>
          {is_job_category === 1 ? (
            <>
              <div className="col-6">
                <label className="auth_pers_label" htmlFor="salaryMin">
                  {t("salaryMin")}
                </label>
                <input
                  placeholder={placeholderLabel}
                  value={AdListingDetails?.salaryMin || ""}
                  name="salaryMin"
                  className={`${AdListingDetails?.salaryMin ? "bg" : ""}`}
                  type="number"
                  onChange={handleAdListingChange}
                  required
                />
              </div>
              <div className="col-6">
                <label className="auth_pers_label" htmlFor="salaryMax">
                  {t("salaryMax")}
                </label>
                <input
                  placeholder={placeholderLabel}
                  value={AdListingDetails?.salaryMax || ""}
                  name="salaryMax"
                  className={`${AdListingDetails?.salaryMax ? "bg" : ""}`}
                  type="number"
                  onChange={handleAdListingChange}
                  required
                />
              </div>
            </>
          ) : (
            <div className="col-12">
              <label
                className={isPriceOptional ? "auth_pers_label" : "auth_label"}
                htmlFor="price"
              >
                {t("price")}
              </label>
              <input
                placeholder={placeholderLabel}
                value={AdListingDetails.price}
                name="price"
                className={`${AdListingDetails.price ? "bg" : ""}`}
                type="number"
                onChange={handleAdListingChange}
                required
              />
            </div>
          )}
          <div className="col-12">
            <label htmlFor="phone" className="auth_label">
              {t("phone")}
            </label>
            <PhoneInput
            separateDialCode
            enableSearch
            countryCodeEditable={false}
            dropdownStyle={{ direction: "ltr" }}
              country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY}
              // عرض الرقم كاملاً داخل الـ input: country_code (بدون +) + local
              value={
                AdListingDetails?.country_code && AdListingDetails?.phone
                  ? AdListingDetails.country_code.replace(/^\+/, "") +
                  AdListingDetails.phone
                  : AdListingDetails?.phone || AdListingDetails?.country_code?.replace(/^\+/, "") || ""
              }
              onChange={(phone, data) => {
                const dial = data?.dialCode || "";
                let normalized = phone.startsWith("+") ? phone.slice(1) : phone;
                // إذا بدأ الرقم برمز الاتصال نُقصُّه
                if (dial && normalized.startsWith(dial)) {
                  normalized = normalized.slice(dial.length);
                }
                // إزالة أصفار بادئة (اختياري — غيّر لو تريد الاحتفاظ بها)
                normalized = normalized.replace(/^0+/, "");

                // حفظ الرقم المحلي بدون رمز الدولة
                handleAdListingChange({
                  target: { name: "phone", value: normalized },
                });
                // حفظ رمز الدولة بالشكل +20 أو +966
                handleAdListingChange({
                  target: { name: "country_code", value: "+" + dial },
                });
                setCountryCode("+" + dial);
              }}
              onCountryChange={(code) => setCountryCode(code)}
              inputProps={{
                name: "phone",
                required: true,
                autoFocus: true,
              }}
              enableLongNumbers
            />
          </div>

          <div className="col-12">
            <label className="auth_pers_label" htmlFor="links">
              {t("videoLink")}
            </label>
            <input
              placeholder={t("enterAdditionalLinks")}
              name="link"
              className={`${AdListingDetails.link ? "bg" : ""}`}
              value={AdListingDetails.link}
              type="url"
              onChange={handleAdListingChange}
            />
          </div>

          <div className="col-12">
            <label className="auth_pers_label" htmlFor="notes">
              {t("notes")}
            </label>
            <textarea
              placeholder={t("notesPlaceholder")}
              name="notes"
              id="notes"
              className={`${AdListingDetails.notes ? "bg" : ""}`}
              value={AdListingDetails.notes || ""}
              onChange={handleAdListingChange}
              rows={3}
            />
          </div>

          <div className="formBtns">
            <button
              type="button"
              className="nextBtn"
              onClick={handleDetailsSubmit}
            >
              {t("next")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentTwo;
