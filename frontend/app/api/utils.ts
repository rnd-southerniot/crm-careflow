import forge from "node-forge";
import { cookies } from "next/headers";

const cryptographIV = String(process.env.NEXT_PUBLIC_CRYPTOGRAPH_IV);
const encryptSecrets = String(process.env.NEXT_PUBLIC_ENCRYPT_SECRETS) === "true" ? true : false;
const salt = "";

export const cookieOptions = {
  httpOnly: true, // Secure cookie
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax" as "lax" | "strict" | "Strict" | "Lax" | "none" | "None" | undefined, // CSRF protection
  domain: process.env.NEXT_PUBLIC_DOMAIN || undefined, // Shared domain (set for cross-app cookies)
  path: "/" // Accessible across apps
};

// + Internal encrypt function
function encrypt({ data }: { data: string | number | bigint }): string {
  if (!encryptSecrets) {
    return data.toString();
  }

  const cipher = forge.rc2.createEncryptionCipher(salt);
  cipher.start(cryptographIV);
  cipher.update(forge.util.createBuffer(data.toString()));
  cipher.finish();
  return cipher.output.toHex();
}

// + Internal decrypt function
function decrypt({ encryptedText }: { encryptedText: string | number | bigint }): string | null {
  if (!encryptSecrets) {
    return encryptedText.toString();
  }

  try {
    const decipher = forge.rc2.createDecryptionCipher(salt);
    decipher.start(cryptographIV);
    decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedText.toString())));
    decipher.finish();
    return decipher.output.data;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

// + Function To set cookie on server side
export const setServerSideCookie = async ({
  cookieName,
  data
}: {
  cookieName: string;
  data: any;
}) => {
  const cookieStore = await cookies();
  const encryptedValue = encrypt({
    data: JSON.stringify(data)
  });

  cookieStore.set(cookieName, encryptedValue, {
    domain: cookieOptions.domain,
    httpOnly: cookieOptions.httpOnly,
    sameSite: "lax",
    secure: cookieOptions.secure,
    path: cookieOptions.path
  });
};

// + Function to get cookie from server side
export const getServerSideCookie = async (name: string) => {
  const cookieStore = await cookies();
  const encryptedValue = cookieStore.get(name)?.value;

  if (!encryptedValue) return null;

  const data = decrypt({
    encryptedText: encryptedValue
  });

  return data ? JSON.parse(data) : null;
};

// + Function to delete cookie from server side
export const deleteServerSideCookie = async (cookieName: string) => {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
};

// + Function to delete all cookies from server side
export const deleteAllServerSideCookie = async () => {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  allCookies.forEach((element) => {
    cookieStore.delete(element.name);
  });
};
