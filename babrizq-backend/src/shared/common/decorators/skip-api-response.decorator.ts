import { SetMetadata } from '@nestjs/common';

export const SKIP_API_RESPONSE_KEY = 'skipApiResponse';

/**
 * Marks a route whose response must NOT be wrapped in the standard envelope
 * (e.g. HTTP redirects for the Google OAuth callback).
 */
export const SkipApiResponse = () => SetMetadata(SKIP_API_RESPONSE_KEY, true);
