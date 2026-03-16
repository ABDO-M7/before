import React from 'react'
import Skeleton, { SkeletonTheme } from "react-loading-skeleton"

const AiToolCardSkeleton = () => {
    return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
            <div className="tool-icon-card">
                <div className="icon-box" style={{ background: '#f3f4f6' }}>
                    <Skeleton circle width={40} height={40} />
                </div>
                <Skeleton width={100} height={20} />
                <Skeleton width={60} height={12} style={{ marginTop: '8px' }} />
            </div>
        </SkeletonTheme>
    )
}

export default AiToolCardSkeleton
