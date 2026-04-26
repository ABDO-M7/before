'use client';
import dynamic from 'next/dynamic';
import AiToolsSkeleton from "../Skeleton/AiToolsSkeleton";

const PopularAiTools = dynamic(() => import('./PopularAiTools'), {
  ssr: false,
  loading: () => <AiToolsSkeleton />
});

export default function PopularAiToolsClient(props) {
  return <PopularAiTools {...props} />;
}
