/**
 * Driver entity — public API (delivery driver app).
 *
 * @see ./model — the `MockDriver` contract
 * @see ./api — mock endpoints (replace with real API at migration time)
 */
export type { MockDriver } from './model';
export { MOCK_DRIVERS, getDrivers } from './api';
