/** Pestañas. tabs: [{key, label, badge?}] */
export default function Tabs({ tabs, value, onChange, className = '' }) {
  return <div className={`tabs ${className}`} role="tablist">{tabs.map(t =>
    <button key={t.key} type="button" role="tab" aria-selected={value === t.key} onClick={() => onChange(t.key)}>
      {t.label}{t.badge != null && t.badge !== '' && <span className="badge">{t.badge}</span>}</button>)}</div>;
}
