import "server-only";

import { getAuthToken } from "@/lib/auth-cookie";
import { getCurrentCustomer, getErrorStatusCode } from "@/lib/medusa-client";

export async function getCurrentCustomerFromCookie() {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    return await getCurrentCustomer(token);
  } catch (error) {
    if (getErrorStatusCode(error) === 401) {
      return null;
    }
    throw error;
  }
}
