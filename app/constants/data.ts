export const ROLE = {
    SUPERADMIN: 'HA01',
} as const;

export type Role = typeof ROLE[keyof typeof ROLE];

export const PERSONNEL_TYPES = ['SENIOR', 'FASKAM AHLI', 'FASKAM TERAMPIL', 'JUNIOR', 'DG-ACC', 'BASIC', 'ADMIN', 'DRIVER',	'PORTER'];
export const SEAL_LABEL_STATUSES = ['AVAILABLE', 'USED', 'DAMAGED', 'LOST'];
export const SHIPPER_TYPES = ['REGULAR', 'CORPORATE'];
export const VEHICLE_TYPES = [
  { title: 'Truck', value: 'TRUCK' }
];
export const PERSON_GENDER = ['L', 'P'];
export const PERSON_STATUS = ['ACTIVE', 'INACTIVE'];
export const SERVICE_TYPES = ['CHARTER', 'REGULAR'];
export const FLIGHT_CATEGORIES = ['DOMESTIC', 'INTERNATIONAL'];
export const INTERNATIONAL_FLIGHT_TYPES = ['BONDED', 'EXP-UMUM'];
export const BOOKING_STATUS = ['DRAFT', 'PROCEED', 'CANCELLED', 'OUTSTANDING', 'PAID'];
export const JOB_TYPE = ['AVSEC', 'DRIVER'];
export const INVOICE_STATUS = ['PAID', 'UNPAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'];
