export type Parser<S, R> = (input: S[]) => Array<[S[], R]>;

export const succeed = <S, R>(value: R): Parser<S, R> => (input) => [[input, value]];

export const fail = <S, R>(): Parser<S, R> => () => [];

export const symbol = <S>(expected: S): Parser<S, S> => (input) => {
  if (input.length === 0) {
    return [];
  }
  const [head, ...tail] = input;
  return head === expected ? [[tail, head]] : [];
};

// (<*>) exactly as parser application from the paper.
export const ap =
  <S, A, B>(pf: Parser<S, (a: A) => B>, pa: Parser<S, A>): Parser<S, B> =>
  (input) =>
    pf(input).flatMap(([remainingAfterF, f]) =>
      pa(remainingAfterF).map(([remainingAfterA, a]) => [remainingAfterA, f(a)] as [S[], B])
    );

// (<|>) exactly as concatenation of possible results.
export const alt =
  <S, R>(p: Parser<S, R>, q: Parser<S, R>): Parser<S, R> =>
  (input) =>
    [...p(input), ...q(input)];

// (<@) exactly as value mapping over parser results.
export const mapP =
  <S, A, B>(p: Parser<S, A>, f: (a: A) => B): Parser<S, B> =>
  (input) =>
    p(input).map(([remaining, value]) => [remaining, f(value)] as [S[], B]);

export const many = <S, R>(p: Parser<S, R>): Parser<S, R[]> => {
  const manyP: Parser<S, R[]> = (input) =>
    alt(
      ap(mapP(p, (v) => (vs: R[]) => [v, ...vs]), manyP),
      succeed<S, R[]>([])
    )(input);
  return manyP;
};

export const many1 = <S, R>(p: Parser<S, R>): Parser<S, R[]> =>
  ap(mapP(p, (v) => (vs: R[]) => [v, ...vs]), many(p));

export const combinators = {
  "<*>": ap,
  "<|>": alt,
  "<@": mapP
} as const;
