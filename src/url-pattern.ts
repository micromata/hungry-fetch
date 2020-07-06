export function testWildcardPattern(urlToCheck: string, pattern: string) {
  const splittedUrlToCheck = urlToCheck.split('/');
  const splittedPattern = pattern.split('/');

  if (splittedUrlToCheck.length !== splittedPattern.length) {
    return false;
  }

  return splittedPattern.every((patternPart, i) => {
    if (patternPart === "*")
      return true;

    return splittedUrlToCheck[i] === patternPart;
  });
}
