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

    // 1. Validation
    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (!tag) {
        return NextResponse.json({ message: 'Missing tag' }, { status: 400 });
    }

    try {
        // 2. Revalidate by Tag
        revalidateTag(tag);
        return NextResponse.json({ revalidated: true, tag, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
    }
}

// Support POST just in case backend prefers it
export async function POST(request) {
    return GET(request);
}
