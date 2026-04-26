'use client';
import dynamic from 'next/dynamic';
import PopularCategoriesSkeleton from "../Skeleton/PopularCategoriesSkeleton";

const PopularCategories = dynamic(() => import('./PopularCategories'), {
  ssr: false,
  loading: () => <PopularCategoriesSkeleton />
});

export default function PopularCategoriesClient(props) {
  return <PopularCategories {...props} />;
}
