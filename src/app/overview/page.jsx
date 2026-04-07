import LandingPage from "@/components/LandingPage"
import Layout from "@/components/Layout/Layout"

// Quick searches for header (helps avoid late header re-render)
const fetchQuickSearches = async () => {
    try {
        const url = new URL(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}quick-searches`
        );
        url.searchParams.set('featured', '1');
        const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ['quick-searches'] } });
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return [];
        const json = await res.json();
        const list = json?.data?.data ?? json?.data;
        return Array.isArray(list) ? list : [];
    } catch (e) {
        console.error('Error fetching quick searches:', e?.message || e);
        return [];
    }
};

// System settings needed immediately for Layout + Landing hero text
const fetchSettings = async () => {
    try {
        const url = new URL(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-system-settings`
        );
        const res = await fetch(url.toString(), { next: { revalidate: 3600, tags: ['seo-settings'] } });
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
        const json = await res.json();
        return json || null;
    } catch (e) {
        console.error('Error fetching settings:', e?.message || e);
        return null;
    }
};

export const generateMetadata = async () => {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}seo-settings?page=landing`,
            { next: { revalidate: 3600, tags: ['seo-settings'] } } // Revalidate every 1 hour
        );
        const data = await res.json();
        const landing = data?.data?.[0];

        return {
            title: landing?.title ? landing?.title : process.env.NEXT_PUBLIC_META_TITLE,
            description: landing?.description ? landing?.description : process.env.NEXT_PUBLIC_META_DESCRIPTION,
            openGraph: {
                images: landing?.image ? [landing?.image] : [],
            },
            keywords: landing?.keywords ? landing?.keywords : process.env.NEXT_PUBLIC_META_kEYWORDS
        };
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};

const OverviewPage = async () => {
    const [initialQuickSearchItems, initialSettings] = await Promise.all([
        fetchQuickSearches(),
        fetchSettings(),
    ]);

    return (
        <Layout initialQuickSearchItems={initialQuickSearchItems} initialSettings={initialSettings}>
            <LandingPage />
        </Layout>
    )
}

export default OverviewPage
