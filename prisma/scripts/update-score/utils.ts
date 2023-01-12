export function getScoreOfEntity(entity: any) {
  const hasAvatar = entity.avatar !== undefined && entity.avatar !== null;
  const hasLogo = entity.logo !== undefined && entity.logo !== null;
  const hasPosition = entity.position !== undefined && entity.position !== null;
  const hasBio = entity.bio !== undefined && entity.bio !== null;
  const hasSkills = entity.skills !== undefined && entity.skills.length > 0;
  const hasInterests =
    entity.interests !== undefined && entity.interests.length > 0;
  const hasAreas = entity.areas !== undefined && entity.areas.length > 0;
  const hasOffers = entity.offers !== undefined && entity.offers.length > 0;
  const hasSeekings =
    entity.seekings !== undefined && entity.seekings.length > 0;
  const hasFocuses = entity.focuses !== undefined && entity.focuses.length > 0;

  let score = 0;

  if (hasAvatar) {
    score = score + 3;
  }
  if (hasLogo) {
    score = score + 3;
  }
  if (hasPosition) {
    score = score + 2;
  }
  if (hasBio) {
    score = score + 3;
  }
  if (hasSkills) {
    score = score + 1;
  }
  if (hasInterests) {
    score = score + 1;
  }
  if (hasAreas) {
    score = score + 1;
  }
  if (hasOffers) {
    score = score + 3;
  }
  if (hasSeekings) {
    score = score + 3;
  }
  if (hasFocuses) {
    score = score + 1;
  }

  return score;
}
