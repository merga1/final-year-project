import { redirect } from 'next/navigation';
import { OverviewContent } from '../components/overview-content';
import { getOverview } from '../lib/admin-api';
import { getServerToken } from '../lib/auth';

export default async function HomePage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const overview = await getOverview(token);
    return <OverviewContent overview={overview} />;
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
