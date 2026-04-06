-- Inventory management
CREATE TABLE public.inventory_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name           text NOT NULL,
  category       text NOT NULL, -- e.g. 'harness', 'ascender', 'descender', 'carabiner', 'rope', 'drill', 'other'
  type           text NOT NULL CHECK (type IN ('personal', 'company')),
  assigned_to    uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- null = company item
  serial_number  text,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  notes          text,
  created_at     timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Owners see all items for their account
CREATE POLICY "Owners manage their inventory"
  ON public.inventory_items
  USING (owner_id = auth.uid() OR public.get_my_owner_id() = owner_id);

-- Write: only owners and lead_techs (checked in app layer via role)
CREATE POLICY "Owners and lead techs can insert"
  ON public.inventory_items FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR public.get_my_owner_id() = owner_id);

CREATE POLICY "Owners and lead techs can update"
  ON public.inventory_items FOR UPDATE
  USING (owner_id = auth.uid() OR public.get_my_owner_id() = owner_id);

CREATE POLICY "Owners and lead techs can delete"
  ON public.inventory_items FOR DELETE
  USING (owner_id = auth.uid() OR public.get_my_owner_id() = owner_id);

CREATE INDEX inventory_items_owner_id_idx ON public.inventory_items (owner_id);
CREATE INDEX inventory_items_assigned_to_idx ON public.inventory_items (assigned_to);
