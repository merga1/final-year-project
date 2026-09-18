import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getTechnicians } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function TechniciansPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const techs = await getTechnicians(token);

    return (
      <AdminShell currentPath="/technicians">
        <div className="section-container">
          <div className="section-header-row">
            <h2 className="section-main-title">Technicians</h2>
            <Link href="/technicians/new" className="btn-primary-blue">
              Add New Technician
            </Link>
          </div>

          <div className="entity-card-list">
            {techs.map((tech) => {
              const displayName = tech.name || `${tech.firstName ?? ''} ${tech.lastName ?? ''}`.trim() || 'Technician';
              const specialization = tech.specialization || 'No specialization';
              const status = tech.status === 'on_duty' ? 'Active' : tech.status === 'off_duty' ? 'Inactive' : 'On Leave';

              return (
                <div key={tech.id} className="technician-item-card">
                  <div className="tech-info-col">
                    <span className="tech-name">{displayName}</span>
                    <span className="tech-spec">{specialization}</span>
                  </div>

                  <div className="tech-contact-col">
                    <span className="tech-email">{tech.email}</span>
                    <span className="tech-status">Status: {status}</span>
                  </div>

                  <div className="tech-actions-col">
                    <button type="button" className="btn-outline-gray">
                      View Details
                    </button>
                    <Link href={`/support-tickets?techId=${tech.id}`} className="btn-outline-purple">
                      View Assigned Tickets
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AdminShell>
    );
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') redirect('/login');
    throw e;
  }
}
