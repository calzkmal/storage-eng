import type { z } from "zod";
import type { FractionSchema } from "@/lib/schema";
export default function FractionVisual({ visual }: { visual: z.infer<typeof FractionSchema> }) {
  return <figure className="my-4"><div role="img" aria-label={`${visual.numerator} dari ${visual.denominator} bagian sama besar, pecahan ${visual.numerator}/${visual.denominator}`} className="flex h-14 w-full max-w-80 overflow-hidden rounded-lg border-2 border-slate-700">
    {Array.from({ length: visual.denominator }, (_, i) => <div key={i} className={`flex-1 border-r border-slate-700 last:border-0 ${i < visual.numerator ? "bg-sky-500" : "bg-white"}`} />)}
  </div><figcaption className="mt-1 text-sm">{visual.numerator}/{visual.denominator} bagian diarsir</figcaption></figure>;
}
