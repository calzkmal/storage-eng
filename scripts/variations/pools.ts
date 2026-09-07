import type { PoolItem } from "./builders";
import { presentContinuous, presentPerfect, presentPerfectContinuous, presentSimple } from "./pools-present";
import { pastContinuous, pastPerfect, pastPerfectContinuous, pastSimple } from "./pools-past";
import { futureContinuous, futurePerfect, futurePerfectContinuous, simpleFuture } from "./pools-future";
import {
  adverbDegree,
  adverbFrequency,
  adverbManner,
  adverbPlace,
  adverbTime,
  doDontDoesnt,
} from "./pools-adverbs";

/** Item pool per lesson id. Variations are composed from these. */
export const POOLS: Record<string, PoolItem[]> = {
  "present-continuous": presentContinuous,
  "present-simple": presentSimple,
  "present-perfect": presentPerfect,
  "present-perfect-continuous": presentPerfectContinuous,
  "past-simple": pastSimple,
  "past-continuous": pastContinuous,
  "past-perfect": pastPerfect,
  "past-perfect-continuous": pastPerfectContinuous,
  "simple-future": simpleFuture,
  "future-continuous": futureContinuous,
  "future-perfect": futurePerfect,
  "future-perfect-continuous": futurePerfectContinuous,
  "adverb-manner": adverbManner,
  "adverb-time": adverbTime,
  "adverb-place": adverbPlace,
  "adverb-frequency": adverbFrequency,
  "adverb-degree": adverbDegree,
  "do-dont-doesnt": doDontDoesnt,
};
