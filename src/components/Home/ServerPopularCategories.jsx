import PopularCategories from "./PopularCategories";

// Default language for server-side fetch so categories come in correct locale (matches app default)
const DEFAULT_LANG = 'ar';

const fetchFeaturedCategories = async () => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-categories`
    );
    url.searchParams.set('page', '1');
    url.searchParams.set('featured', '1');
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
      headers: { 'Content-Language': DEFAULT_LANG },
    });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    const json = await res.json();
    const inner = json?.data;
    if (inner && Array.isArray(inner.data)) {
      return { list: inner.data, current_page: inner.current_page, last_page: inner.last_page };
    }
    return null;
  } catch (e) {
    console.error('Error fetching featured categories:', e?.message || e);
    return null;
  }
};

export default async function ServerPopularCategories() {
  const data = await fetchFeaturedCategories();
  return (
    <>
      {/* Render title on server so the LCP text can paint earlier */}
      <div className="container main_padding">
        <div className="row mrg_btm">
          <div className="col-12">
            <div className="pop_cat_header">
              <h2 className="pop_cat_head text-dark">تصفح اقسام الاعلانات</h2>
            </div>
          </div>
        </div>
      </div>
      <PopularCategories initialCategoriesData={data} showTitle={false} />
    </>
  );
}
