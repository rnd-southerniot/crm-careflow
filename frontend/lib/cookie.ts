// packages/auth/src/cookie.ts
import Cookies from "js-cookie";
import forge from "node-forge";

const cryptographIV = "5Q9jR6L2sX";
const encryptSecrets = true;
const salt = "";

// Internal encrypt function
export function encrypt({ data }: { data: string | number | bigint }): string {
  if (!encryptSecrets) {
    return data.toString();
  }

  const cipher = forge.rc2.createEncryptionCipher(salt);
  cipher.start(cryptographIV);
  cipher.update(forge.util.createBuffer(data.toString()));
  cipher.finish();
  return cipher.output.toHex();
}

// Internal decrypt function
export function decrypt({
  encryptedText,
}: {
  encryptedText: string | number | bigint;
}): string | null {
  if (!encryptSecrets) {
    return encryptedText.toString();
  }

  try {
    const decipher = forge.rc2.createDecryptionCipher(salt);
    decipher.start(cryptographIV);
    decipher.update(
      forge.util.createBuffer(forge.util.hexToBytes(encryptedText.toString()))
    );
    decipher.finish();
    return decipher.output.data;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

// Public API: Set encrypted cookie
export async function setCookie({
  name,
  options,
  value,
}: {
  name: string;
  value: string;
  options: Cookies.CookieAttributes;
}) {
  const encryptedValue = encrypt({
    data: value,
  });

  Cookies.set(name, encryptedValue, {
    ...options,
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? false,
    sameSite: options.sameSite ?? "lax",
    domain: options.domain,
    path: options.path ?? "/",
    expires: options.expires ?? 7, // Default to 7 days
  });
}

// Public API: Get decrypted cookie
export function getCookie({ name }: { name: string }) {
  let encryptedValue: string | undefined;

  encryptedValue = Cookies.get(name);

  if (!encryptedValue) return null;
  const data = decrypt({
    encryptedText: encryptedValue,
  });

  if(data){
    return JSON.parse(data)
  }

  return null;
}

// Public API: Delete cookie
export function deleteCookie(
  name: string,
  options: Cookies.CookieAttributes = {}
) {
  Cookies.remove(name, {
    ...options,
    domain: options.domain,
    path: options.path ?? "/",
  });
}

// Public API: Clear all cookies
export function clearAllCookies(options: Cookies.CookieAttributes = {}) {
  const allCookies = Cookies.get();
  Object.keys(allCookies).forEach(cookieName => {
    Cookies.remove(cookieName, {
      ...options,
      domain: options.domain,
      path: options.path ?? "/",
    });
  });
}
