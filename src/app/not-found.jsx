import { redirect } from 'next/navigation'

// 'use client'
// import React, { useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import Err404 from "../../public/assets/no_data_found_illustrator.svg"
// import Link from 'next/link'
// import { placeholderImage, t } from '@/utils'
// import { FaArrowLeft } from 'react-icons/fa6'

const NotFoundPage = ({ page }) => {
  redirect('/blogs')

  // Old code - commented out
  // return (
  //   <div className='err404'>
  //     <img loading="lazy" height={500} width={500} src={Err404} alt="404-Img" onErrorCapture={placeholderImage} />
  //     <Link href='/' prefetch={false} className='btn' style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
  //       <FaArrowLeft /> {t('back')}
  //     </Link>
  //   </div>
  // )
}

export default NotFoundPage
