export default function Loading() {
  return (
    <main className="page-loading-screen" role="status" aria-live="polite">
      <div className="page-loading-card">
        <div className="page-loading-spinner" aria-hidden="true">
          <span />
        </div>
        <p>Loading FoodFlow</p>
        <span className="sr-only">Please wait while the page loads.</span>
      </div>
    </main>
  );
}
