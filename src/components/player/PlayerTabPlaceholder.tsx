export function PlayerTabPlaceholder() {
  return (
    <section className="sc-panel overflow-hidden">
      <header className="sc-panel-header sc-panel-header-pink">Player profile</header>
      <div className="sc-empty-state mx-4 my-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-sc-icon/30 bg-gradient-to-br from-sc-logo/20 to-sc-icon/15 text-xl">
          <span aria-hidden>⛏</span>
        </div>
        <p className="text-sm font-semibold text-white/80">Your Skyblock card</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/45">
          Sync your profile above to load skills, collections, and progress. A
          compact SkyCrypt-style viewer will appear here.
        </p>
      </div>
    </section>
  );
}
