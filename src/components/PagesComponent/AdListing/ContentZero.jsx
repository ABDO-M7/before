'use client'
import React from 'react'
import { t } from '@/utils'

const ContentZero = ({ AdListingDetails, handleAdListingChange, handleTitleSubmit }) => {
  return (
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
            autoFocus
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
        <div className="formBtns mobileHidden">
          <button
            type="button"
            className="nextBtn"
            onClick={handleTitleSubmit}
            disabled={!AdListingDetails.title.trim() || !AdListingDetails.desc.trim()}
          >
            {t("next")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContentZero

