export default function Home() {
  return (
    <main style={{ padding: 20 }}>
      <h1>IV Tracker</h1>
      <a href="/api/auth/login"><button>Connect to Schwab</button></a>
      <p>Once connected, hit <code>/api/atm-iv</code> to see JSON.</p>
    </main>
  );
}