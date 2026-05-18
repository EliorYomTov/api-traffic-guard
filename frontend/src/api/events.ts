import client from './client';
import type { PagedEventsResponse, EventsQueryParams } from './types';

/**
 * GET /api/v1/events
 * Returns a paginated, tenant-scoped list of security events.
 * The JWT in the Authorization header identifies the tenant automatically.
 */
export async function fetchEvents(params: EventsQueryParams = {}): Promise<PagedEventsResponse> {
    const { data } = await client.get<PagedEventsResponse>('/api/v1/events', { params });
    return data;
}
