import { type ClassValue, clsx } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";
import * as d3 from "d3-color";

export const basePath = String(process.env.NEXT_PUBLIC_API_MASK_URL);
export const baseResourcePath = String(process.env.NEXT_PUBLIC_RESOURCE_MASK_URL);

export const cookieOptions = {
  httpOnly: false, // Secure cookie
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax" as "lax" | "strict" | "Strict" | "Lax" | "none" | "None" | undefined, // CSRF protection
  domain: process.env.NODE_ENV === "production" ? ".vercel.app" : "localhost", // Shared domain
  path: "/" // Accessible across apps
};

interface CustomFormData extends FormData {
  append(name: string, value: string | Blob | File | null, fileName?: string): void;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAvatarFallback(string: string) {
  const names = string.split(" ").filter((name: string) => name);
  const mapped = names.map((name: string) => name.charAt(0).toUpperCase());

  return mapped.join("");
}

export function getHSLValue(hex: string): string {
  return d3.color(hex)!.formatHsl().slice(4, -1).replaceAll(",", "");
}

// + Function To Fetch Image Data
export const fetchImageData = async (imageSrc: string, imageName: string): Promise<File | null> => {
  try {
    const response = await fetch(imageSrc, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    const file = new File([blob], imageName, { type: blob.type });
    return file;
  } catch (error) {
    console.error("Error fetching image data:", error);
    return null; // Return null to indicate failure
  }
};

// + Function to get current latitude and longitude
export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    // Check if Geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    // Request current position
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error: GeolocationPositionError) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      }
    );
  });
};

// Debounce utility function with cancel capability
export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  const debounced = (...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  return { debounced, cancel };
};

// + Function to open the IndexedDB database
export const openIndexedDatabase = async (databaseName: string) => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);

    request.onerror = (event) => {
      if (event.target != null) {
        const idbRequest = event.target as IDBRequest;
        console.error("Error opening database:", idbRequest.error);
        reject(idbRequest.error);
      }
    };

    request.onsuccess = (event) => {
      if (event.target != null) {
        const idbRequest = event.target as IDBRequest;
        const db = idbRequest.result;
        resolve(db);
      }
    };

    request.onupgradeneeded = (event) => {
      if (event.target != null) {
        const idbRequest = event.target as IDBRequest;
        const db = idbRequest.result;

        // Create an object store (if it doesn't exist)
        if (!db.objectStoreNames.contains(databaseName)) {
          db.createObjectStore(databaseName, { keyPath: "id" });
        }
      }
    };
  });
};

// + Function To Add data to IndexedDB
export const addDataToIndexedDB = async (databaseName: string, data: any) => {
  const db: any = await openIndexedDatabase(databaseName);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([databaseName], "readwrite");
    const store = transaction.objectStore(databaseName);
    const request = store.add(data);

    request.onsuccess = () => {
      resolve("Data added successfully.");
    };

    request.onerror = (event: any) => {
      console.error("Error adding data:", event.target.error);
      reject(event.target.error);
    };
  });
};

// + Function To Get all data from IndexedDB
export const getDataFromIndexedDB = async (databaseName: string) => {
  const db: any = await openIndexedDatabase(databaseName);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([databaseName], "readonly");
    const store = transaction.objectStore(databaseName);
    const request = store.getAll();

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      console.error("Error getting data:", event.target.error);
      reject(event.target.error);
    };
  });
};

// + Function To Remove data from IndexedDB by key
export const removeDataFromIndexedDB = async (databaseName: string, key: string) => {
  const db: any = await openIndexedDatabase(databaseName);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([databaseName], "readwrite");
    const store = transaction.objectStore(databaseName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve("Data deleted successfully.");
    };

    request.onerror = (event: any) => {
      console.error("Error deleting data:", event.target.error);
      reject(event.target.error);
    };
  });
};

// + Function To Convert an image file to base64 string
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert image to Base64"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading the file"));
    };

    reader.readAsDataURL(file);
  });
};

export const getAPIResponse = async (
  basePath: string,
  apiPath: string,
  token: string | null = null,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  body: FormData | string | null = null,
  addMultipartHeader = false
) => {
  const headers: Record<string, string> = {
    ...(token ? { Authorization: token } : {}),
    "Access-Control-Allow-Origin": "*"
  };

  if (body) {
    if (body instanceof FormData && addMultipartHeader) {
      // If body is a FormData object, set Content-Type to multipart/form-data
      headers["Content-Type"] = "multipart/form-data";
    } else if (typeof body === "string") {
      // If body is a string, assume it's JSON and set Content-Type to application/json
      headers["Content-Type"] = "application/json";
    }
  }

  const apiHeader = {
    method: `${method}`,
    headers: headers,
    body: body != null ? body : null
  };

  console.log(apiHeader);
  const results = await fetch(`${basePath + apiPath}`, apiHeader);
  return results.json();
};
