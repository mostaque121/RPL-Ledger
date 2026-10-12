-- RPL Ledger — starting course list, taken from the old workbook ("Interested Course" and
-- "Qualification" columns). Safe to run more than once. Run after 0003.
--
-- Spellings were cleaned up to "CODE Title" (no dash). Old spellings merged into one course:
--   "CHC52021 - / – Diploma of Community Services"              → CHC52021 Diploma of Community Services
--   "SIT30821 – Certificate III in Commercial Cookery"          → SIT30821 Certificate III in Commercial Cookery
--   "TAE40122 – Certificate IV in Training and Assessment"      → TAE40122 Certificate IV in Training and Assessment
--   "CHC43015 - Certificate IV in Ageing Support"               → CHC43015 Certificate IV in Ageing Support
--   "First Aid and CPR", "First Aid CPR",
--   "HLTAID011 - Provide First Aid & HLTAID009 - Provide ..."   → HLTAID011 & HLTAID009 First Aid and CPR
--   "HTLAID009 Provide CPR" (typo)                              → HLTAID009 Provide CPR
-- The Phase 8 Excel import uses the same mapping.

insert into public.courses (name) values
  ('2 Units of Building and Construction'),
  ('AUR30320 Certificate III in Automotive Electrical Technology'),
  ('AUR31120 Certificate III in Heavy Commercial Vehicle Mechanical Technology'),
  ('BSB50420 Diploma of Leadership and Management'),
  ('BSB80120 Graduate Diploma of Management (Learning)'),
  ('CHC30125 Certificate III in Early Childhood Education and Care'),
  ('CHC33021 Certificate III in Individual Support'),
  ('CHC40221 Certificate IV in School Based Education Support'),
  ('CHC40321 Certificate IV in Child, Youth and Family Intervention'),
  ('CHC43015 Certificate IV in Ageing Support'),
  ('CHC43121 Certificate IV in Disability Support'),
  ('CHC43315 Certificate IV in Mental Health'),
  ('CHC50121 Diploma of Early Childhood Education and Care'),
  ('CHC52021 Diploma of Community Services'),
  ('CHC62015 Advanced Diploma of Community Sector Management'),
  ('CPC30220 Certificate III in Carpentry'),
  ('CPC32420 Certificate III in Plumbing'),
  ('CPC40120 Certificate IV in Building and Construction'),
  ('CPC40920 Certificate IV in Plumbing and Services'),
  ('CPC50220 Diploma of Building and Construction (Building)'),
  ('CPP51122 Diploma of Property (Agency Management)'),
  ('FNS40222 Certificate IV in Accounting and Bookkeeping'),
  ('FNS50322 Diploma of Finance and Mortgage Broking Management'),
  ('HLTAID009 Provide CPR'),
  ('HLTAID011 & HLTAID009 First Aid and CPR'),
  ('MEM31922 Certificate III in Engineering - Fabrication Trade'),
  ('SIT30821 Certificate III in Commercial Cookery'),
  ('SIT40521 Certificate IV in Kitchen Management'),
  ('TAE40122 Certificate IV in Training and Assessment')
on conflict do nothing;
