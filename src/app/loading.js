/**
 * Shown immediately while the page segment is loading (e.g. server fetching data).
 * Prevents white screen — user sees a structured shimmer instead of a blank page.
 * Next.js uses this as the Suspense fallback for the root segment.
 */
import HomePageLoading from '@/components/Home/HomePageLoading';

export default function Loading() {
  return <HomePageLoading />;
}
