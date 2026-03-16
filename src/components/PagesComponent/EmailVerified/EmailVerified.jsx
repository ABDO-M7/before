"use client";

import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent";
import { useSearchParams } from "next/navigation";
import { t } from "@/utils";

const EmailVerified = () => {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  return (
    <section className="email-verified">
      <BreadcrumbComponent title2={t("emailVerification")} />
      <div className="container">
        <div className="page_content text-center py-10">
          {status === "success" ? (
            <>
              <h1 className="text-2xl font-bold text-green-600 mb-4">
                ✅ {t("emailVerifiedSuccess")}
              </h1>
              <p>{t("youCanLoginNow")}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                ❌ {t("invalidVerificationLink")}
              </h1>
              <p>{t("pleaseRequestNewLink")}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default EmailVerified;
