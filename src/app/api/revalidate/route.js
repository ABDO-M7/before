import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-Demand Revalidation Webhook
 * Usage: GET /api/revalidate?secret=YOUR_SECRET&path=/blogs/[slug]
 *    or: GET /api/revalidate?secret=YOUR_SECRET&tag=blogs
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  // 1. Validation
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  try {
    // 2. Revalidate by Path
    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, now: Date.now(), path });
    }

    // 3. Revalidate by Tag
    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, now: Date.now(), tag });
    }

    return NextResponse.json({ message: 'Missing path or tag' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
  }
}

// Support POST just in case backend prefers it
export async function POST(request) {
    return GET(request);
}
