"use client";

import dynamic from "next/dynamic";

// Dynamically load Toaster only on the client side to avoid blocking FCP
const Toaster = dynamic(() => import("react-hot-toast").then((mod) => mod.Toaster), { ssr: false });

export default Toaster;
