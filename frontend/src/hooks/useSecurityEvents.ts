import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '../api/events'
import type { EventsQueryParams, PagedEventsResponse } from '../api/types'

/**
 * Fetches paginated security events for the authenticated tenant.
 *
 * Usage:
 *   const { data, isLoading, isError } = useSecurityEvents({ severity: 'CRITICAL' })
 *
 * The query key includes all params so changing filter/page
 * automatically triggers a new fetch.
 */
export function useSecurityEvents(params: EventsQueryParams = {}) {
    return useQuery<PagedEventsResponse>({
        queryKey: ['securityEvents', params],
        queryFn:  () => fetchEvents(params),
    })
}
