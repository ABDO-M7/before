import PopularAiTools from "./PopularAiTools";

const fetchFeaturedAiTool = async () => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}ai-tools`
    );
    url.searchParams.set('hub', 'web');
    url.searchParams.set('featured', '1');
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    const json = await res.json();
    return json?.data ? json.data : null;
  } catch (e) {
    console.error('Error fetching featured AI tool:', e?.message || e);
    return null;
  }
};

const getServerCompressedImage = (item, size) => {
  if (!item || typeof item !== 'object') return item?.image || null;
  const compressed = item?.compressed;
  if (compressed && typeof compressed === 'object' && !Array.isArray(compressed)) {
    if (compressed[size]) return compressed[size];
    if (compressed.small) return compressed.small;
    if (compressed.medium) return compressed.medium;
    if (compressed.large) return compressed.large;
  }
  return item.image || null;
};

const serverNormalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/([^:]\/)\/+/g, '$1');
  }
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!apiUrl) return url;

  let cleanImagePath = url.startsWith('/') ? url : `/${url}`;
  const baseEndsWithPublic = /\/public$/i.test(apiUrl);
  if (baseEndsWithPublic && /^\/public(\/|$)/i.test(cleanImagePath)) {
    cleanImagePath = cleanImagePath.replace(/^\/public/i, '');
  }

  return `${apiUrl}${cleanImagePath}`.replace(/([^:]\/)\/+/g, '$1');
};

export default async function ServerPopularAiTools() {
  const data = await fetchFeaturedAiTool();

  const lcpImage = data?.show_image !== false
    ? serverNormalizeUrl(getServerCompressedImage(data, 'large'))
    : null;

  return (
    <>
      {lcpImage && (
        <link rel="preload" as="image" href={lcpImage} fetchPriority="high" />
      )}
      <PopularAiTools initialAiToolData={data} />
    </>
  );
}
