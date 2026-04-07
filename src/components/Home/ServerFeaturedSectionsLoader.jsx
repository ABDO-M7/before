import FeaturedSectionsBlock from "./ServerFeaturedSections";

const fetchFeaturedSectionsWithItems = async () => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-featured-section`
    );
    url.searchParams.set('hub', 'web');
    url.searchParams.set('limit', '4');
    const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ['sliders', 'tips'] } });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return [];
    const data = await res.json();
    const sections = data?.data || [];
    return Array.isArray(sections)
      ? sections.map((s) => ({
          ...s,
          section_data: Array.isArray(s?.section_data) ? s.section_data : [],
        }))
      : [];
  } catch (error) {
    console.error('Error fetching Featured sections:', error.message || error);
    return [];
  }
};

export default async function ServerFeaturedSectionsLoader({ children }) {
  const data = await fetchFeaturedSectionsWithItems();
  return (
    <FeaturedSectionsBlock initialFeaturedData={data}>
      {children}
    </FeaturedSectionsBlock>
  );
}
