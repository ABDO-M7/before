// Ali has commented it cause it is not used or not have to import it - This file is unused (superseded by app/layout.js)
// import AppProviders from "./providers";
// Ali has commented it cause it is not used or not have to import it - This file is unused (superseded by app/layout.js)
// import "../../public/css/style.css";
// Ali has commented it cause it is not used or not have to import it - This file is unused (superseded by app/layout.js), Bootstrap already loaded via CDN in active layout
// import "bootstrap/dist/css/bootstrap.css";
// Ali has commented it cause it is not used or not have to import it - This file is unused (superseded by app/layout.js)
// import { Toaster } from "react-hot-toast";
// Ali has commented it cause it is not used or not have to import it - This file is unused (superseded by app/layout.js)
// import 'react-loading-skeleton/dist/skeleton.css';
// Ali has commented it cause it is not used or not have to import it - This file is unused (superseded by app/layout.js)
// import Script from "next/script";

// Ali has commented it cause it is not used or not have to import it - This entire file is unused (superseded by app/layout.js)
// export const generateMetadata = async () => {
//   try {
//     const res = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-system-settings`,
//       { next: { revalidate: 3600 } }
//     );
//     const data = await res.json();
//     const favicon = data?.data?.favicon_icon;
//     return {
//       icons: [{ url: favicon }],
//     };
//   } catch (error) {
//     console.error("Error fetching MetaData:", error);
//     return null;
//   }
// };

// Ali has commented it cause it is not used or not have to import it - This entire file is unused (superseded by app/layout.js)
// export default async function RootLayout({ children }) {
//   return (
//     <html lang="en" web-version={process.env.NEXT_PUBLIC_WEB_VERSION}>
//       <head>
//         {/* ✅ Google Analytics */}
//         <Script
//           async
//           src="https://www.googletagmanager.com/gtag/js?id=G-0HFB4XLPLV"
//         />
//         <Script id="google-analytics">
//           {`
//             window.dataLayer = window.dataLayer || [];
//             function gtag(){dataLayer.push(arguments);}
//             gtag('js', new Date());
//             gtag('config', 'G-0HFB4XLPLV');
//           `}
//         </Script>

//         <link
//           href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
//           rel="stylesheet"
//           integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM"
//           crossOrigin="anonymous"
//         />
//       </head>

//       <body>
//         <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
//         <AppProviders>
//           <Toaster position="top-center" reverseOrder={false} />
//           {children}
//         </AppProviders>
//       </body>
//     </html>
//   );
// }
