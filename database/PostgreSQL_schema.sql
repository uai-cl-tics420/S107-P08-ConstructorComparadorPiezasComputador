CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE public.components_mirror (
  component_id UUID PRIMARY KEY,
  name_model VARCHAR(160) NOT NULL,
  type_id UUID NOT NULL,
  brand_id UUID,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.prices (
  id BIGSERIAL PRIMARY KEY,
  component_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price > 0),
  discount_price NUMERIC(12,2) CHECK (discount_price > 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (component_id, vendor_id, recorded_at),
  FOREIGN KEY (component_id) REFERENCES public.components_mirror(component_id)
);

CREATE INDEX idx_prices_component_time ON public.prices (component_id, recorded_at DESC);
CREATE INDEX idx_prices_vendor_time ON public.prices (vendor_id, recorded_at DESC);
CREATE INDEX idx_prices_recorded_brin ON public.prices USING BRIN (recorded_at);
CREATE INDEX idx_components_mirror_type_component ON public.components_mirror (type_id, component_id);
CREATE INDEX idx_components_mirror_name_model ON public.components_mirror (name_model);
