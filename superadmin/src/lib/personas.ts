/** The 9 in-scope personas (doc/superadmin_modules.md §2.2), alphabetical. */
export interface Persona {
  key: string;
  label: string;
}

export const PERSONAS: Persona[] = [
  { key: 'agriMarketSeller', label: 'Agri Market Seller' },
  { key: 'agriVyapari', label: 'Agri Vyapari' },
  { key: 'equipmentOwner', label: 'Equipment Owner' },
  { key: 'farmLandlord', label: 'Farm Landlord' },
  { key: 'farmer', label: 'Farmer' },
  { key: 'gurukulInstructor', label: 'Gurukul Instructor' },
  { key: 'milkVendor', label: 'Milk Vendor' },
  { key: 'transporter', label: 'Transporter' },
  { key: 'womenHub', label: 'Women Hub' },
];

export const personaLabel = (key: string): string | undefined =>
  PERSONAS.find((p) => p.key === key)?.label;

/** Personas with a live module in this build — navigation only lists these. */
export const BUILT_PERSONAS: Persona[] = PERSONAS.filter((p) => p.key === 'agriMarketSeller');
