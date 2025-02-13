// TODO: fix any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getScoreOfEntity(entity: any) {
  const hasAvatar = entity.avatar !== undefined && entity.avatar !== null;
  const hasLogo = entity.logo !== undefined && entity.logo !== null;
  const hasPosition = entity.position !== undefined && entity.position !== null;
  const hasTypes = entity.types !== undefined && entity.types.length > 0;
  const hasBio = entity.bio !== undefined && entity.bio !== null;
  const hasAreas = entity.areas !== undefined && entity.areas.length > 0;
  // Include this when present on profile card -> Exclude fields that aren't present on profile card anymore
  // const hasOffers = entity.offers !== undefined && entity.offers.length > 0;
  // const hasSeekings =
  //   entity.seekings !== undefined && entity.seekings.length > 0;

  let score = 0;

  if (hasAvatar) {
    score = score + 1;
  }
  if (hasLogo) {
    score = score + 1;
  }
  if (hasPosition) {
    score = score + 1;
  }
  if (hasTypes) {
    score = score + 1;
  }
  if (hasBio) {
    score = score + 1;
  }
  if (hasAreas) {
    score = score + 1;
  }
  // Include this when present on profile card -> Exclude fields that aren't present on profile card anymore
  // if (hasOffers) {
  //   score = score + 3;
  // }
  // if (hasSeekings) {
  //   score = score + 3;
  // }

  return score;
}
