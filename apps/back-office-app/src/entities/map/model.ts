/**
 * Map entity — domain model (back office).
 *
 * Extracted from the legacy `entities/backOfficeData.ts` during the Phase 2
 * cleanup (see `MIGRATION.md`). Represents a driver's live position on the
 * back-office map. NOTE: this is a placeholder for real map integration —
 * production coordinates would arrive via WebSocket or be polled from
 * `GET /api/backoffice/drivers/locations`.
 */
export interface DriverLocation {
  driverId: string;
  /** Normalized 0–100 horizontal position on the mock map canvas */
  x: number;
  /** Normalized 0–100 vertical position on the mock map canvas */
  y: number;
  status: 'available' | 'assigned' | 'in_transit';
}
