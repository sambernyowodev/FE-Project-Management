-- Migration: Create Master Holidays Table & Seed Indonesian National Holidays
-- Date: 2026-09-09

-- 1. Create master_holidays Table
CREATE TABLE IF NOT EXISTS public.master_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_holidays_year ON public.master_holidays (year);
CREATE INDEX IF NOT EXISTS idx_master_holidays_date ON public.master_holidays (holiday_date);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.master_holidays ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow read access to all authenticated and anon users
CREATE POLICY "Allow public/authenticated read access on master_holidays"
  ON public.master_holidays
  FOR SELECT
  USING (true);

-- Allow all insert/update/delete for authenticated users
CREATE POLICY "Allow authenticated insert on master_holidays"
  ON public.master_holidays
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on master_holidays"
  ON public.master_holidays
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on master_holidays"
  ON public.master_holidays
  FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anon write access if authentication is bypassed/demo mode
CREATE POLICY "Allow anon all on master_holidays"
  ON public.master_holidays
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_master_holidays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_master_holidays_updated_at ON public.master_holidays;
CREATE TRIGGER trg_master_holidays_updated_at
  BEFORE UPDATE ON public.master_holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_master_holidays_updated_at();

-- 6. Seed Indonesian National Holidays (2025 - 2027)
INSERT INTO public.master_holidays (holiday_date, name, year)
VALUES
  -- 2025
  ('2025-01-01', 'Tahun Baru 2025 Masehi', 2025),
  ('2025-01-27', 'Isra Mikraj Nabi Muhammad SAW', 2025),
  ('2025-01-29', 'Tahun Baru Imlek 2576 Kongzili', 2025),
  ('2025-03-29', 'Hari Suci Nyepi (Tahun Baru Saka 1947)', 2025),
  ('2025-03-31', 'Hari Raya Idul Fitri 1446 H', 2025),
  ('2025-04-01', 'Hari Raya Idul Fitri 1446 H (Hari Kedua)', 2025),
  ('2025-04-18', 'Wafat Yesus Kristus', 2025),
  ('2025-04-20', 'Kebangkitan Yesus Kristus (Paskah)', 2025),
  ('2025-05-01', 'Hari Buruh Internasional', 2025),
  ('2025-05-12', 'Hari Raya Waisak 2569 BE', 2025),
  ('2025-05-29', 'Kenaikan Yesus Kristus', 2025),
  ('2025-06-01', 'Hari Lahir Pancasila', 2025),
  ('2025-06-06', 'Hari Raya Idul Adha 1446 H', 2025),
  ('2025-06-27', 'Tahun Baru Islam 1447 H', 2025),
  ('2025-08-17', 'Hari Kemerdekaan Republik Indonesia', 2025),
  ('2025-09-05', 'Maulid Nabi Muhammad SAW', 2025),
  ('2025-12-25', 'Kelahiran Yesus Kristus (Hari Natal)', 2025),

  -- 2026
  ('2026-01-01', 'Tahun Baru 2026 Masehi', 2026),
  ('2026-01-16', 'Isra Mikraj Nabi Muhammad SAW', 2026),
  ('2026-02-17', 'Tahun Baru Imlek 2577 Kongzili', 2026),
  ('2026-03-19', 'Hari Suci Nyepi (Tahun Baru Saka 1948)', 2026),
  ('2026-03-20', 'Hari Raya Idul Fitri 1447 H', 2026),
  ('2026-03-21', 'Hari Raya Idul Fitri 1447 H (Hari Kedua)', 2026),
  ('2026-04-03', 'Wafat Yesus Kristus', 2026),
  ('2026-04-05', 'Kebangkitan Yesus Kristus (Paskah)', 2026),
  ('2026-05-01', 'Hari Buruh Internasional', 2026),
  ('2026-05-14', 'Kenaikan Yesus Kristus', 2026),
  ('2026-05-27', 'Hari Raya Idul Adha 1447 H', 2026),
  ('2026-05-31', 'Hari Raya Waisak 2570 BE', 2026),
  ('2026-06-01', 'Hari Lahir Pancasila', 2026),
  ('2026-06-16', 'Tahun Baru Islam 1448 H', 2026),
  ('2026-08-17', 'Hari Kemerdekaan Republik Indonesia', 2026),
  ('2026-08-25', 'Maulid Nabi Muhammad SAW', 2026),
  ('2026-12-25', 'Kelahiran Yesus Kristus (Hari Natal)', 2026),

  -- 2027
  ('2027-01-01', 'Tahun Baru 2027 Masehi', 2027),
  ('2027-01-05', 'Isra Mikraj Nabi Muhammad SAW', 2027),
  ('2027-02-06', 'Tahun Baru Imlek 2578 Kongzili', 2027),
  ('2027-03-09', 'Hari Suci Nyepi (Tahun Baru Saka 1949)', 2027),
  ('2027-03-10', 'Hari Raya Idul Fitri 1448 H', 2027),
  ('2027-03-11', 'Hari Raya Idul Fitri 1448 H (Hari Kedua)', 2027),
  ('2027-03-26', 'Wafat Yesus Kristus', 2027),
  ('2027-03-28', 'Kebangkitan Yesus Kristus (Paskah)', 2027),
  ('2027-05-01', 'Hari Buruh Internasional', 2027),
  ('2027-05-06', 'Kenaikan Yesus Kristus', 2027),
  ('2027-05-16', 'Hari Raya Idul Adha 1448 H', 2027),
  ('2027-05-20', 'Hari Raya Waisak 2571 BE', 2027),
  ('2027-06-01', 'Hari Lahir Pancasila', 2027),
  ('2027-06-06', 'Tahun Baru Islam 1449 H', 2027),
  ('2027-08-17', 'Hari Kemerdekaan Republik Indonesia', 2027),
  ('2027-08-15', 'Maulid Nabi Muhammad SAW', 2027),
  ('2027-12-25', 'Kelahiran Yesus Kristus (Hari Natal)', 2027)
ON CONFLICT (holiday_date) DO UPDATE 
SET 
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  updated_at = timezone('utc'::text, now());
