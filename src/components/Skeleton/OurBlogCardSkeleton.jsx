import Skeleton, { SkeletonTheme } from "react-loading-skeleton"

const OurBlogCardSkeleton = () => {
    return (
        <SkeletonTheme baseColor="lightgray" highlightColor="#e0e0e0">
            <div className='ourblog_card' style={{ minHeight: '350px' }}>
                <Skeleton width="100%" height={200} className='blog_card_img' style={{ borderRadius: '12px' }} />
                <Skeleton count={1.3} style={{ marginTop: '12px' }} />
                <Skeleton count={2} style={{ marginTop: '8px' }} />
                <Skeleton count={0.4} style={{ marginTop: '8px' }} />
            </div>
        </SkeletonTheme>
    )
}

export default OurBlogCardSkeleton