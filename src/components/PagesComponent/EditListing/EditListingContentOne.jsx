'use client'
import React from 'react'
import { FaAngleRight } from "react-icons/fa";
import Image from 'next/image'
import { placeholderImage, getCompressedImage, normalizeImageUrl } from '@/utils';
import { settingsData } from '@/redux/reuducer/settingSlice';
import { useSelector } from 'react-redux';


const ContentOne = ({ handleCategoryTabClick, CurrenCategory, userSelectedCategory }) => {
  const selectedCategoryIds = userSelectedCategory?.split(',')?.map(id => parseInt(id, 10));
  const filteredCategories = CurrenCategory?.filter(category =>
    selectedCategoryIds?.includes(category.id)
  );
  const systemSettingsData = useSelector(settingsData)
  const settings = systemSettingsData?.data

  return (
    <>
      {filteredCategories.map((tab1) => (
        <div className="col-md-6 col-lg-4 catDetails" key={tab1.id} onClick={() => handleCategoryTabClick(tab1)}>
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
            <span>{tab1.name}</span>
          </div>
          {tab1?.subcategories && tab1?.subcategories.length > 0 &&
            <span><FaAngleRight /></span>
          }
        </div>
      ))}
    </>
  );
}

export default ContentOne
