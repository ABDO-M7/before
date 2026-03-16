import { redirect } from 'next/navigation';

// Redirect /home to /
export default function HomeRedirect() {
  redirect('/');
}
