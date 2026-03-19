export type LoadFormData = {
  origin_location_id: string;
  destination_location_id: string;
  loading_date: string; // ISO date string (YYYY-MM-DD)
};

export type Location = {
  id: string;
  state: string;
  city: string;
};

export type AvailabilityStatus = "active" | "closed";

export type AvailabilityFormData = {
  truck_id: string;
  origin_location_id: string;
  destination_location_id: string;
  available_from: string; // ISO date string
  available_till?: string; // ISO date string
  expected_rate?: number;
};

export type Availability = AvailabilityFormData & {
  id: string;
  driver_id: string;
  status: AvailabilityStatus;
  created_at: string;
  updated_at: string;
};

export type AvailabilityWithDetails = Availability & {
  truck: {
    id: string;
    category: string;
    variant_id: string;
  };
  origin_location: {
    city: string;
    state: string;
  } | null;
  destination_location: {
    city: string;
    state: string;
  } | null;
};

export type TruckCategory =
  | "open"
  | "container"
  | "lcv"
  | "mini_pickup"
  | "trailer"
  | "tipper"
  | "tanker"
  | "dumper"
  | "bulker";

export type PermitType =
  | "national_permit"
  | "state_permit"
  | "all_india_permit"
  | "goods_carriage"
  | "contract_carriage";

export type TruckFormData = {
  category: TruckCategory;
  variant_id: string;
  capacity_tons: number;
  permit_type: PermitType;
  axle_count: number;
  wheel_count: number;
  internal_length: number;
  internal_width: number;
  internal_height: number;
  gps_available: boolean;
};

export type Truck = TruckFormData & {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type TruckVariant = {
  id: string;
  category: string;
  display_name: string;
  is_active: boolean;
};

