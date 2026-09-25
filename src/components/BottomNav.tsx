/**
 * Mobile bottom tab bar.
 */
import type { Strings } from '../i18n';

export type Tab = 'map' | 'feed' | 'stats' | 'ranks' | 'time' | 'diplo';

const TABS: { id: Tab; icon: string; labelKey: keyof Strings }[] = [
  { id: 'map', icon: '🗺️', labelKey: 'tab.map' },
  { id: 'feed', icon: '📡', labelKey: 'tab.feed' },
  { id: 'stats', icon: '📊', labelKey: 'tab.stats' },
  { id: 'ranks', icon: '🏆', labelKey: 'tab.ranks' },
  { id: 'time', icon: '⏳', labelKey: 'tab.time' },
  { id: 'diplo', icon: '💬', labelKey: 'tab.diplo' },
];

export default function BottomNav({ tab, onTab, t }: { tab: Tab; onTab: (t: Tab) => void; t: Strings }) {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-50 border-t border-white/10">
      <div className="mx-auto grid max-w-2xl grid-cols-6" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => onTab(tb.id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${
              tab === tb.id ? 'text-cyan-300' : 'text-white/60'
            }`}
          >
            <span className="text-xl">{tb.icon}</span>
            {t[tb.labelKey]}
          </button>
        ))}
      </div>
    </nav>
  );
}
