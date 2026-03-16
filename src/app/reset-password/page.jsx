import Layout from '@/components/Layout/Layout';
import ResetPassword from '@/components/PagesComponent/ResetPassword/ResetPassword';

export const generateMetadata = async () => {
  return {
    title: 'Reset Password',
    description: 'Enter a new password to reset your account',
  };
};

const ResetPasswordPage = () => {
  return (
    <Layout>
      <ResetPassword />
    </Layout>
  );
};

export default ResetPasswordPage;
