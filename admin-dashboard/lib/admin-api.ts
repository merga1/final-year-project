import type { OverviewResponse } from '../components/overview-content';

export async function getOverview(): Promise<OverviewResponse> {
  const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const response = await fetch(`${baseUrl}/api/admin/overview`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load admin overview');
  }

  return response.json();
}
