import Layout from '@/components/Layout/Layout';
import EmailVerified from '@/components/PagesComponent/EmailVerified/EmailVerified';

export const generateMetadata = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}seo-settings?page=email-verified`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const meta = data?.data?.[0];

    return {
      title: meta?.title || 'Email Verified',
      description: meta?.description || 'Your email has been successfully verified.',
      openGraph: {
        images: meta?.image ? [meta?.image] : [],
      },
      keywords: meta?.keywords || 'email verification, success',
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {
      title: 'Email Verified',
      description: 'Your email has been successfully verified.',
    };
  }
};

const EmailVerifiedPage = () => {
  return (
    <Layout>
      <EmailVerified />
    </Layout>
  );
};

export default EmailVerifiedPage;
