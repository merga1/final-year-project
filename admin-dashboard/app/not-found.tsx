import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        gap: 16,
      }}
    >
      <div style={{ fontSize: '4rem', fontWeight: 800, color: '#e2e8f0' }}>404</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
        Page or resource not found
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
        The item you&apos;re looking for may have been deleted or the URL is incorrect.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 8,
          padding: '10px 24px',
          background: '#1e6b52',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
