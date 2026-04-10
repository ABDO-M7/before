import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-Demand Revalidation Webhook
 * Triggered by Laravel Admin Panel
 * Usage: GET /api/revalidate?secret=YOUR_SECRET&tag=blogs
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const tag = searchParams.get('tag');
    const tagsFromMulti = searchParams.getAll('tag');

    // 1. Validation
    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    const resolvedTags = (() => {
        const raw = tagsFromMulti && tagsFromMulti.length > 0 ? tagsFromMulti : (tag ? [tag] : []);
        return raw
            .flatMap((t) => String(t || '').split(','))
            .map((t) => t.trim())
            .filter(Boolean);
    })();

    if (resolvedTags.length === 0) {
        return NextResponse.json({ message: 'Missing tag' }, { status: 400 });
    }

    try {
        // 2. Revalidate by Tag(s)
        resolvedTags.forEach((t) => revalidateTag(t));
        return NextResponse.json({ revalidated: true, tags: resolvedTags, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
    }
}

// Support POST just in case backend prefers it
export async function POST(request) {
    return GET(request);
}
