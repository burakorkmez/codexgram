import { isClerkAPIResponseError } from '@clerk/expo';

export function authErrorMessage(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error &&
      ['ERR_REQUEST_CANCELED', 'ERR_CANCELED', 'SIGN_IN_CANCELLED'].includes(String(error.code))) {
    return null;
  }
  if (isClerkAPIResponseError(error)) {
    return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? 'Sign-in could not be completed. Please try again.';
  }
  return 'We couldn’t connect to sign-in. Check your connection and try again.';
}
