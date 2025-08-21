export /**
 * Creates a SHA-1 hash of the input string
 * @param input
 * @returns
 */
const sha1 = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();

  const hash = await crypto.subtle.digest("SHA-1", encoder.encode(input));
  const hashArray = new Uint8Array(hash);

  let hashString = "";
  for (const element of hashArray) {
    hashString += element.toString(16).padStart(2, "0");
  }
  return hashString;
};
