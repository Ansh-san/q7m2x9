const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchCalendar(cutoff = '09:50') {
  const params = new URLSearchParams({ cutoff });
  const res = await fetch(`${BASE_URL}/api/calendar?${params}`);
  if (!res.ok) throw new Error(`Failed to load calendar: ${res.statusText}`);
  return res.json();
}

export async function fetchMetrics(cutoff = '09:50', date = null) {
  const params = new URLSearchParams({ cutoff });
  if (date) params.append('date', date);
  const res = await fetch(`${BASE_URL}/api/metrics?${params}`);
  if (!res.ok) throw new Error(`Failed to load metrics: ${res.statusText}`);
  return res.json();
}

export async function fetchTimeseries(cutoff = '09:50', date = null, tradingDate = null) {
  const params = new URLSearchParams({ cutoff });
  if (date) params.append('date', date);
  if (tradingDate) params.append('trading_date', tradingDate);
  const res = await fetch(`${BASE_URL}/api/timeseries?${params}`);
  if (!res.ok) throw new Error(`Failed to load timeseries: ${res.statusText}`);
  return res.json();
}
