"use client";
import { List } from 'react-window';
import { InfiniteLoader } from 'react-window-infinite-loader';
import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProdcutHorizontalCard from '@/components/Cards/ProdcutHorizontalCard';

/**
 * ✅ Virtual Scrolling Component for Product List View
 * Improves performance for long lists by only rendering visible items
 * 
 * @param {Array} items - Array of product items to display
 * @param {Function} handleLike - Callback for like action
 * @param {number} userId - Current user ID
 * @param {boolean} hasNextPage - Whether there are more items to load
 * @param {Function} loadMore - Callback to load more items
 * @param {boolean} isLoading - Loading state
 */
const VirtualizedProductList = ({
  items = [],
  handleLike,
  userId,
  hasNextPage = false,
  loadMore,
  isLoading = false,
}) => {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const itemHeight = 180; // Approximate height of ProductHorizontalCard

  // Calculate container height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Use available viewport height minus header/footer
        const viewportHeight = window.innerHeight;
        const estimatedHeight = Math.max(400, viewportHeight - 300); // Min 400px, account for header/footer
        setContainerHeight(estimatedHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Check if item is loaded
  const isItemLoaded = useCallback((index) => {
    return index < items.length;
  }, [items.length]);

  // List row renderer component (react-window v2 API)
  const ListRow = useCallback(({ index, style, ...rest }) => {
    if (index >= items.length) {
      // Loading placeholder
      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader adListingLoader" style={{ margin: '20px auto' }}></div>
        </div>
      );
    }

    const item = items[index];
    if (!item) {
      return <div style={{ ...style, padding: '8px 0', boxSizing: 'border-box', minHeight: itemHeight }} />;
    }

    return (
      <div
        style={{
          ...style,
          padding: '8px 0',
          boxSizing: 'border-box',
        }}
      >
        <Link
          href={userId === item?.user_id ? `/my-listing/${encodeURIComponent(item?.slug || '')}` : `/product-details/${encodeURIComponent(item?.slug || '')}`}
          prefetch={false}
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <ProdcutHorizontalCard data={item} handleLike={handleLike} />
        </Link>
      </div>
    );
  }, [items, userId, handleLike]);

  if (!items || items.length === 0) {
    return null;
  }

  // Calculate total items including placeholder for loading
  const itemCount = hasNextPage ? items.length + 1 : items.length;

  // Load more handler
  const loadMoreItems = useCallback((startIndex, stopIndex) => {
    if (!isLoading && hasNextPage && stopIndex >= items.length - 5) {
      // Load more when user scrolls near the end (5 items before end)
      loadMore();
    }
  }, [isLoading, hasNextPage, items.length, loadMore]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: containerHeight }}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            listRef={ref}
            height={containerHeight}
            rowCount={itemCount}
            rowHeight={itemHeight}
            style={{ width: '100%' }}
            onRowsRendered={onItemsRendered}
            overscanCount={3} // Render 3 extra items above/below viewport for smoother scrolling
            rowComponent={ListRow}
            rowProps={{ items, handleLike, userId }}
          />
        )}
      </InfiniteLoader>
    </div>
  );
};

export default VirtualizedProductList;
