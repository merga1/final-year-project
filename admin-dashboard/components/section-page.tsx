import { AdminShell } from './admin-shell';

type Stat = {
  label: string;
  value: string;
};

type Row = {
  primary: string;
  secondary: string;
  status: string;
};

type SectionPageProps = {
  currentPath: string;
  title: string;
  description: string;
  status: string;
  stats: Stat[];
  tableTitle: string;
  rows: Row[];
};

function statusClassName(status: string) {
  if (status === 'Online' || status === 'Verified' || status === 'Resolved' || status === 'Stable') {
    return 'badge ok';
  }

  if (status === 'Warning' || status === 'Pending' || status === 'In Review' || status === 'Scheduled') {
    return 'badge warn';
  }

  return 'badge danger';
}

export function SectionPage({
  currentPath,
  title,
  description,
  status,
  stats,
  tableTitle,
  rows,
}: SectionPageProps) {
  return (
    <AdminShell
      currentPath={currentPath}
      title={title}
      description={description}
      status={status}
    >
      <section className="grid">
        {stats.map((stat) => (
          <article className="card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <h3>{tableTitle}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Detail</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.primary}-${row.secondary}`}>
                <td>{row.primary}</td>
                <td>{row.secondary}</td>
                <td>
                  <span className={statusClassName(row.status)}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
