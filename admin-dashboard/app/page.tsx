import { OverviewContent } from '../components/overview-content';
import { getOverview } from '../lib/admin-api';

export default async function HomePage() {
  const overview = await getOverview();

  return <OverviewContent overview={overview} />;
}
