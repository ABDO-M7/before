import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const endPoint = process.env.NEXT_PUBLIC_END_POINT;
    
    // Construct the Laravel API URL
    const laravelFeedUrl = `${apiUrl}${endPoint}facebook-feed`;
    
    // Fetch the XML feed from Laravel API
    const response = await fetch(laravelFeedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
      // Cache for 1 hour (3600 seconds) - adjust as needed
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.error(`Laravel API returned status: ${response.status}`);
      return new NextResponse(
        `Error fetching feed: ${response.status} ${response.statusText}`,
        { 
          status: response.status,
          headers: {
            'Content-Type': 'text/plain',
          }
        }
      );
    }

    // Get the XML content
    const xmlContent = await response.text();

    // Return the XML with proper headers
    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching Facebook feed:', error);
    return new NextResponse(
      'Internal Server Error: Failed to fetch Facebook feed',
      { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        }
      }
    );
  }
}

