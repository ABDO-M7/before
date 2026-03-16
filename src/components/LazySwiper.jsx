"use client";
import dynamic from "next/dynamic";

// ✅ Lazy load Swiper to reduce initial bundle size
// Import CSS immediately (it's small and needed)
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const Swiper = dynamic(
  () => import("swiper/react").then((mod) => mod.Swiper),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: "200px" }} />,
  }
);

const SwiperSlide = dynamic(
  () => import("swiper/react").then((mod) => mod.SwiperSlide),
  {
    ssr: false,
  }
);

// Export modules for use in components
export { Swiper, SwiperSlide };

// Export modules separately (they're small, can be imported normally)
export { Autoplay, Navigation, Pagination, FreeMode } from "swiper/modules";
