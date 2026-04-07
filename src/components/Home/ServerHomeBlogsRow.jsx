import HomeBlogsRow from "./HomeBlogsRow";

const fetchBlogsForHome = async () => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs`
    );
    url.searchParams.set('sort_by', 'new-to-old');
    url.searchParams.set('hub', 'web');
    url.searchParams.set('limit', '3');
    const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ['blogs'] } });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return [];
    const json = await res.json();
    const list = json?.data?.data?.data ?? json?.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Error fetching blogs for home:', e?.message || e);
    return [];
  }
};

export default async function ServerHomeBlogsRow() {
  const data = await fetchBlogsForHome();
  return <HomeBlogsRow initialBlogsData={data} />;
}
