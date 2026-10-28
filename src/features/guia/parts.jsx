/** Piezas de la guía: enlace a un módulo y tabla simple. */
import { useNavigate } from 'react-router-dom';

export function Go({ to, children }) {
  const nav = useNavigate();
  return <button type="button" className="glink" onClick={() => nav(to)}>{children}</button>;
}
export function T({ h, rows }) {
  return <div className="gtw"><table className="gt"><thead><tr>{h.map(x => <th key={x}>{x}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>;
}
export const Dl = ({ items }) => <dl className="gdl">{items.map(([t, d]) => <FragmentDl key={t} t={t} d={d} />)}</dl>;
const FragmentDl = ({ t, d }) => <><dt>{t}</dt><dd>{d}</dd></>;
