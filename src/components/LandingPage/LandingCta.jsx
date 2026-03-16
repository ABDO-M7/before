"use client";
import Link from "next/link";
import { t } from "@/utils";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";

const LandingCta = () => {
  // Subscribe to language changes to trigger re-render when language changes
  const CurrentLanguage = useSelector(CurrentLanguageData);

  return (
    <section id="landing_cta" className="landing_cta">
      <div className="container">
        <div className="landing_cta_inner">
          <div className="landing_cta_content">
            <p className="landing_cta_kicker">{t("buySell")}</p>
            <h2 className="landing_cta_title">
              {t("anythingYouWant")}
            </h2>
            <p className="landing_cta_subtitle">
              {t("discoverEndlessPossibilitiesAt")}
            </p>
          </div>
          <div className="landing_cta_actions">
            <Link href="/home" className="landing_cta_btn landing_cta_btn_primary">
              {t("search")}
            </Link>
            <Link href="/ad-listing" className="landing_cta_btn landing_cta_btn_secondary">
              {t("add")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCta;

