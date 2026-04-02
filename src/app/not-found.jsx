'use client'
import React from 'react'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa6'

const NotFoundPage = () => {
  return (
    <div className='err404' style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
      gap: '1.5rem',
    }}>
      <div style={{ fontSize: '6rem', fontWeight: 800, color: '#06aabd', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: '1.5rem', color: '#333', margin: 0 }}>الصفحة غير موجودة</h1>
      <p style={{ color: '#666', margin: 0 }}>عذراً، لم نتمكن من إيجاد الصفحة التي تبحث عنها</p>
      <Link
        href='/'
        prefetch={false}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          backgroundColor: '#06aabd',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontSize: '15px',
        }}
      >
        <FaArrowLeft />
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  )
}

export default NotFoundPage
