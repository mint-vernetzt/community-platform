export function getRandomUniqueSubset<T>(arr: T[], subsetLength?: number): T[] {
  let length =
    subsetLength !== undefined && subsetLength < arr.length
      ? subsetLength
      : Math.floor(Math.random() * (arr.length - 1));
  let randomSubset: T[] = [];
  let copy = [...arr];
  for (let i = 0; i < length; i++) {
    let randomIndex = Math.floor(Math.random() * copy.length);
    let randomElement = copy[randomIndex];
    randomSubset.push(randomElement);
    copy.splice(randomIndex, 1);
  }
  return randomSubset;
}

export function getMultipleRandomUniqueSubsets<T>(
  arr: T[],
  numberOfSubsets: number
): T[][] {
  let randomSubsets: T[][] = [];
  let copy = [...arr];
  for (let i = 0; i < numberOfSubsets; i++) {
    randomSubsets.push([]);
  }
  let i = 0;
  while (copy.length > 0) {
    let randomIndex = Math.floor(Math.random() * copy.length);
    let randomElement = copy[randomIndex];
    randomSubsets[i % numberOfSubsets].push(randomElement);
    copy.splice(randomIndex, 1);
    i++;
  }
  return randomSubsets;
}
