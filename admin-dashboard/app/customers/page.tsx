import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminShell } from '../../components/admin-shell';
import { getCustomers } from '../../lib/admin-api';
import { getServerToken } from '../../lib/auth';

export default async function CustomersPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  try {
    const customers = await getCustomers(token);

    return (
      <AdminShell currentPath="/customers">
        <div className="section-container">
          <div className="section-header-row">
            <h2 className="section-main-title">Customer List</h2>
            <Link href="/customers/new" className="btn-primary-blue">
              Add New Customer
            </Link>
          </div>

          <div className="entity-card-list">
            {customers.map((cust) => {
              const displayName =
                cust.name ||
                `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim() ||
                'Customer';

              return (
                <div key={cust.id} className="customer-item-card">
                  <div className="cust-info-col">
                    <span className="cust-name">{displayName}</span>
                    <span className="cust-email">Email: {cust.email}</span>
                  </div>

                  <div className="cust-actions-col">
                    <button type="button" className="btn-outline-gray">
                      View Details
                    </button>
                    <Link
                      href={`/support-tickets?customerId=${cust.id}`}
                      className="btn-outline-purple"
                    >
                      View Tickets
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
