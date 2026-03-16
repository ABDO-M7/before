'use client'
import React from 'react'
import { FaAngleRight } from "react-icons/fa";
import Image from 'next/image'
import { useSelector } from 'react-redux';
import { placeholderImage, getCompressedImage, normalizeImageUrl } from '@/utils';
import { t } from "@/utils"
import { settingsData } from '@/redux/reuducer/settingSlice';



const ContentOne = ({ handleCategoryTabClick, CurrenCategory, currentPage, lastPage, fetchMoreCategory, IsLoading, IsLoadMoreCat, CurrentPath }) => {

  const systemSettingsData = useSelector(settingsData)
  const settings = systemSettingsData?.data

  // Determine if we're showing subcategories (CurrentPath has items means we've selected a category)
  const isShowingSubcategories = CurrentPath && CurrentPath.length > 0

  return (
    <>
      <>

        {
          CurrenCategory.length > 0 && (
            <span className='contentTitle'>
              {isShowingSubcategories ? t('chooseSubCategory') : t('ChooseCategory')}
            </span>
          )
        }

        {CurrenCategory.length > 0 && CurrenCategory.map((tab1) => (

          <div className="col-md-6 col-lg-4 catDetails" key={tab1?.id} onClick={() => handleCategoryTabClick(tab1)}>
            <div>
              <span className='imgWrapper'>
                {(() => {
                  // Use 'small' compressed image for category, fallback to original if compressed doesn't exist
                  const originalImage = tab1?.image || null;
                  const compressedImage = getCompressedImage(tab1, 'small', originalImage);
                  const finalImage = (compressedImage && compressedImage !== originalImage) ? compressedImage : (originalImage || null);
                  const imageSrc = finalImage ? normalizeImageUrl(finalImage) : (settings?.placeholder_image || null);
                  
                  return (
<Image 
                    loading="lazy"
                    src={imageSrc || settings?.placeholder_image} 
                    height={45} 
                    width={45} 
                    alt='categoryImg' 
                    onErrorCapture={placeholderImage} 
                  />
                  );
                })()}
              </span>
              <span>{tab1.translated_name}</span>
            </div>
            {tab1?.subcategories_count && tab1?.subcategories_count > 0 ?
              (
                <span><FaAngleRight className='angle_right' /></span>
              ) : null
            }
          </div>
        ))}

        {
          IsLoading && <div className="loader adListingLoader"></div>
        }

      </>
      {
        IsLoadMoreCat ? (
          <div className="loader adListingLoader"></div>
        ) : (
          currentPage < lastPage && (
            <div className="loadMore">
              <button onClick={fetchMoreCategory}> {t('loadMore')} </button>
            </div>
          )
        )
      }

    </>
  );

}

export default ContentOne
