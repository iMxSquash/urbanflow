ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.spatial_ref_sys
  FOR SELECT
  USING (true);
