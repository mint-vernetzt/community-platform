function getTokenByCredential(credential: string) {
  const splittedCredential = credential.split(":");
  return splittedCredential.length === 2 ? splittedCredential[1].trim() : false;
}

function getUserByCredential(credential: string) {
  const splittedCredential = credential.split(":"); // ?
  return splittedCredential.length === 2 ? splittedCredential[0].trim() : false;
}

function getUserByToken(token: string) {
  const matchingUsers = (process.env.API_KEY ?? "")
    .split(";")
    .filter((credential) => getTokenByCredential(credential) === token); //?

  return matchingUsers.length === 1
    ? getUserByCredential(matchingUsers[0])
    : false;
}

export { getUserByToken };
