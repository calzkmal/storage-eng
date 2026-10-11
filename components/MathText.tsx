"use client";

import { createContext, useContext, type ReactNode } from "react";

export const MathTextContext = createContext(false);

/** Keep answer strings intact; format numeric fractions only at display time. */
export function Fraction({ numerator, denominator }: { numerator: string | number; denominator: string | number }) {
  return <span role="math" aria-label={`${numerator} per ${denominator}`} className="mx-0.5 inline-grid grid-rows-2 text-center align-middle text-[0.85em] leading-tight">
    <span aria-hidden="true" className="border-b border-current px-1">{numerator}</span>
    <span aria-hidden="true" className="px-1">{denominator}</span>
  </span>;
}

export default function MathText({ children, enabled }: { children: string; enabled?: boolean }) {
  const math = useContext(MathTextContext);
  if (!(enabled ?? math)) return <>{children}</>;
  const fractions = /(?<![\p{L}\p{N}_/.,])(-?\d+)\/([1-9]\d*)(?![\p{L}\p{N}_/]|[.,]\d)/gu;
  const parts: ReactNode[] = [];
  let start = 0;
  for (const match of children.matchAll(fractions)) {
    parts.push(children.slice(start, match.index));
    parts.push(<Fraction key={match.index} numerator={match[1]} denominator={match[2]} />);
    start = match.index + match[0].length;
  }
  parts.push(children.slice(start));
  return <>{parts}</>;
}
