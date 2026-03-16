import Layout from '@/components/Layout/Layout';
import FAQS from '@/components/PagesComponent/FAQS/FAQS'
import Script from 'next/script';

export const generateMetadata = async () => {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}seo-settings?page=faqs`,
            { next: { revalidate: 3600 } } // Revalidate every 1 hour
        );
        const data = await res.json();
        const faqs = data?.data?.[0];

        return {
            title: faqs?.title ? faqs?.title : process.env.NEXT_PUBLIC_META_TITLE,
            description: faqs?.description ? faqs?.description : process.env.NEXT_PUBLIC_META_DESCRIPTION,
            openGraph: {
                images: faqs?.image ? [faqs?.image] : [],
            },
            keywords: faqs?.keywords ? faqs?.keywords : process.env.NEXT_PUBLIC_META_kEYWORDS
        };
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'هل موقع أرابلازا وسيط عقاري يأخذ عمولة؟',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'لا، Arablaza هو منصة إعلانية تربط البائع بالمشتري مباشرة. نحن لا نتدخل في الصفقة ولا نتقاضى أي عمولة من البيع أو الإيجار. التفاوض يتم بينكم مباشرة.'
            }
        },
        {
            '@type': 'Question',
            name: 'كيف أتأكد من مصداقية الإعلان والسعر؟',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'نحن نبذل جهدنا لمراجعة الإعلانات، لكننا ننصح دائماً بعدم دفع أي مبلغ مالي قبل معاينة العقار على أرض الواقع، والتأكد من الأوراق الرسمية.'
            }
        },
        {
            '@type': 'Question',
            name: 'ماذا تعني علامة "تم التحقق" بجانب اسم المعلن؟',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'تعني أن هذا المعلن قد قام بتوثيق رقم هاتفه أو هويته معنا، مما يمنحك درجة أمان أعلى عند التعامل معه.'
            }
        },
        {
            '@type': 'Question',
            name: 'لماذا تم رفض إعلاني؟',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'قد يُرفض الإعلان إذا كانت الصور غير واضحة، السعر غير منطقي، أو الوصف مخالف. يرجى التأكد من جودة الصور ودقة المعلومات.'
            }
        }
    ]
};

const page = () => {
    return (
        <>
            <Script
                id="faq-schema"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <Layout>
                <FAQS />
            </Layout>
        </>
    )
}

export default page
