/**
 * Analytics — Combined GA4 + Search Console API
 *
 * Single serverless function that handles:
 *   ?report=ga4       — GA4 traffic data
 *   ?report=sc        — Search Console search analytics
 *   ?report=summary   — Combined summary (default)
 *
 * Uses OAuth 2.0 with refresh token (user's own Google account).
 * Env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
 *           GA4_PROPERTY_ID, SEARCH_CONSOLE_SITE_URL
 *
 * Query params:
 *   period=7d|30d|90d  (default: 30d)
 *   type=queries|pages (Search Console only, default: queries)
 */
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GA4_API = 'https://analyticsdata.googleapis.com/v1beta';
const SC_API = 'https://www.googleapis.com/webmasters/v3';

// ─── OAuth ─────────────────────────────────────────────────────────────────────

async function getAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing OAuth credentials — need GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OAuth token refresh failed: ${response.status} — ${errBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

// ─── GA4 Report ────────────────────────────────────────────────────────────────

async function runGa4Report(token, propertyId, body) {
  const response = await fetch(`${GA4_API}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`GA4 API error: ${response.status} — ${errBody}`);
  }
  return await response.json();
}

async function handleGa4(propertyId, days, startDate, endDate) {
  const token = await getAccessToken();

  const [trafficReport, pagesReport, acquisitionReport] = await Promise.all([
    runGa4Report(token, propertyId, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'totalUsers' }, { name: 'newUsers' }, { name: 'sessions' },
        { name: 'screenPageViews' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    }),
    runGa4Report(token, propertyId, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePathPlusQueryString' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }, { name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 20,
    }),
    runGa4Report(token, propertyId, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
      limit: 10,
    }),
  ]);

  const dailyTraffic = (trafficReport.rows || []).map(row => ({
    date: row.dimensionValues?.[0]?.value || 'unknown',
    totalUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
    newUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
    sessions: parseInt(row.metricValues?.[2]?.value || '0', 10),
    pageViews: parseInt(row.metricValues?.[3]?.value || '0', 10),
    bounceRate: parseFloat(row.metricValues?.[4]?.value || '0'),
    avgSessionDuration: parseFloat(row.metricValues?.[5]?.value || '0'),
  }));

  const topPages = (pagesReport.rows || []).map(row => ({
    page: row.dimensionValues?.[0]?.value || 'unknown',
    pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
    users: parseInt(row.metricValues?.[1]?.value || '0', 10),
    avgSessionDuration: parseFloat(row.metricValues?.[2]?.value || '0'),
  }));

  const channels = (acquisitionReport.rows || []).map(row => ({
    channel: row.dimensionValues?.[0]?.value || 'unknown',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
    sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
    pageViews: parseInt(row.metricValues?.[2]?.value || '0', 10),
  }));

  const totals = dailyTraffic.reduce((acc, d) => {
    acc.totalUsers += d.totalUsers;
    acc.totalSessions += d.sessions;
    acc.totalPageViews += d.pageViews;
    return acc;
  }, { totalUsers: 0, totalSessions: 0, totalPageViews: 0 });

  return {
    configured: true,
    propertyId,
    period: { days, startDate, endDate },
    summary: {
      totalUsers: totals.totalUsers,
      totalSessions: totals.totalSessions,
      totalPageViews: totals.totalPageViews,
      avgSessionDuration: dailyTraffic.length > 0
        ? (dailyTraffic.reduce((s, d) => s + d.avgSessionDuration, 0) / dailyTraffic.length).toFixed(1)
        : 0,
      avgBounceRate: dailyTraffic.length > 0
        ? (dailyTraffic.reduce((s, d) => s + d.bounceRate, 0) / dailyTraffic.length).toFixed(1)
        : 0,
    },
    dailyTraffic,
    topPages,
    channels,
  };
}

// ─── Search Console Report ─────────────────────────────────────────────────────

async function runScQuery(token, siteUrl, body) {
  const encodedUrl = encodeURIComponent(siteUrl);
  const response = await fetch(`${SC_API}/sites/${encodedUrl}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Search Console API error: ${response.status} — ${errBody}`);
  }
  return await response.json();
}

async function handleSc(siteUrl, days, startDate, endDate, reportType) {
  const token = await getAccessToken();
  const dimension = reportType === 'pages' ? 'page' : 'query';

  const result = await runScQuery(token, siteUrl, {
    startDate, endDate,
    dimensions: [dimension],
    rowLimit: 25,
  });

  const rows = (result.rows || []).map(row => ({
    term: row.keys?.[0] || 'unknown',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));

  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const overallCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPosition = rows.length > 0
    ? rows.reduce((s, r) => s + r.position, 0) / rows.length
    : 0;

  return {
    configured: true,
    siteUrl,
    period: { days, startDate, endDate },
    reportType,
    summary: {
      totalClicks,
      totalImpressions,
      overallCtr,
      averagePosition: avgPosition.toFixed(1),
    },
    rows,
  };
}

// ─── Combined Summary ──────────────────────────────────────────────────────────

async function handleSummary(propertyId, siteUrl, days, startDate, endDate) {
  let ga4Data = null;
  let ga4Error = null;
  let scData = null;
  let scError = null;
  let scPages = null;

  try {
    ga4Data = await handleGa4(propertyId, days, startDate, endDate);
  } catch (err) {
    ga4Error = err.message;
  }

  try {
    scData = await handleSc(siteUrl, days, startDate, endDate, 'queries');
  } catch (err) {
    scError = err.message;
  }

  try {
    scPages = await handleSc(siteUrl, days, startDate, endDate, 'pages');
  } catch {
    // non-critical
  }

  const summary = {
    configured: {
      ga4: !!ga4Data?.configured,
      searchConsole: !!scData?.configured,
    },
    period: `?period=${days}d`,
    traffic: ga4Data?.summary ? {
      totalUsers: ga4Data.summary.totalUsers,
      totalSessions: ga4Data.summary.totalSessions,
      totalPageViews: ga4Data.summary.totalPageViews,
      avgBounceRate: ga4Data.summary.avgBounceRate + '%',
      avgSessionDuration: parseInt(ga4Data.summary.avgSessionDuration, 10) + 's',
    } : null,
    searchPerformance: scData?.summary ? {
      totalClicks: scData.summary.totalClicks,
      totalImpressions: scData.summary.totalImpressions,
      avgCtr: scData.summary.overallCtr,
      avgPosition: scData.summary.averagePosition,
    } : null,
    topPagesByTraffic: ga4Data?.topPages?.slice(0, 10) || [],
    topSearchQueries: scData?.rows?.slice(0, 10) || [],
    topPagesBySearch: scPages?.rows?.slice(0, 10) || [],
    channels: ga4Data?.channels || [],
    recommendations: [],
    errors: { ga4: ga4Error, searchConsole: scError },
  };

  // Generate recommendations
  if (ga4Data?.summary) {
    const { totalUsers, totalPageViews, totalSessions } = ga4Data.summary;
    const pagesPerSession = totalSessions > 0 ? (totalPageViews / totalSessions).toFixed(1) : 0;
    if (pagesPerSession < 2) {
      summary.recommendations.push(
        `Low pages-per-session (${pagesPerSession}). Add internal links, related posts, and topic clusters.`
      );
    }
    if (parseFloat(ga4Data.summary.avgBounceRate) > 70) {
      summary.recommendations.push(
        `High bounce rate (${ga4Data.summary.avgBounceRate}%). Improve first-paragraph hooks, add ToC for long articles, ensure mobile readability.`
      );
    }
    if (totalUsers < 50) {
      summary.recommendations.push(
        `Low traffic (${totalUsers} users in ${days}d). Publish more SEO content, share on LinkedIn, build backlinks.`
      );
    }
  }

  if (scData?.summary) {
    const { totalClicks, totalImpressions } = scData.summary;
    if (totalImpressions > 0 && totalClicks === 0) {
      summary.recommendations.push(
        `Getting ${totalImpressions} impressions but 0 clicks. Improve titles and meta descriptions to boost CTR.`
      );
    }
    if (parseFloat(scData.summary.averagePosition) > 15) {
      summary.recommendations.push(
        `Avg search position is ${scData.summary.averagePosition}. Target long-tail keywords and deepen existing content.`
      );
    }
  }

  if (!summary.configured.ga4 && !summary.configured.searchConsole) {
    summary.recommendations.push(
      'Analytics not configured. Set up GA4 + Search Console OAuth credentials in Vercel env vars.'
    );
  } else if (summary.configured.ga4 && !summary.configured.searchConsole) {
    summary.recommendations.push(
      'Search Console not configured. Add SEARCH_CONSOLE_SITE_URL to Vercel env vars.'
    );
  } else if (!summary.configured.ga4 && summary.configured.searchConsole) {
    summary.recommendations.push(
      'GA4 not configured. Add GA4_PROPERTY_ID to Vercel env vars.'
    );
  }

  return summary;
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');

  const report = req.query.report || req.query._report || 'summary';
  const period = (req.query.period || '30d').toLowerCase();
  const reportType = (req.query.type || 'queries').toLowerCase();

  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const propertyId = process.env.GA4_PROPERTY_ID;
  const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;

  const missing = [];
  if (!clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!refreshToken) missing.push('GOOGLE_REFRESH_TOKEN');

  if (report === 'ga4' && !propertyId) missing.push('GA4_PROPERTY_ID');
  if ((report === 'sc' || report === 'summary') && !siteUrl) missing.push('SEARCH_CONSOLE_SITE_URL');

  if (missing.length > 0) {
    return res.status(200).json({
      configured: false,
      message: `Missing env vars: ${missing.join(', ')}`,
      present: {
        GOOGLE_CLIENT_ID: !!clientId,
        GOOGLE_CLIENT_SECRET: !!clientSecret,
        GOOGLE_REFRESH_TOKEN: !!refreshToken,
        GA4_PROPERTY_ID: !!propertyId,
        SEARCH_CONSOLE_SITE_URL: !!siteUrl,
      },
    });
  }

  try {
    let result;
    switch (report) {
      case 'ga4':
        result = await handleGa4(propertyId, days, startDate, endDate);
        break;
      case 'sc':
        result = await handleSc(siteUrl, days, startDate, endDate, reportType);
        break;
      case 'summary':
      default:
        result = await handleSummary(propertyId, siteUrl, days, startDate, endDate);
        break;
    }

    return res.status(200).json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(200).json({
      configured: true,
      error: true,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
