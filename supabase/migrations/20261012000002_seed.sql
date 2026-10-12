-- RPL Ledger — starting data. Safe to run more than once.
-- Employee salaries and commissions are left empty; set them on the Employees page.

insert into public.people (name, role, partner_key) values
  ('Tanvir', 'partner', 'tanvir'),
  ('MD', 'partner', 'md')
on conflict do nothing;

insert into public.people (name, role) values
  ('Reaz', 'employee'),
  ('Mehedi', 'employee'),
  ('Oreviya', 'employee'),
  ('Rawnak', 'employee')
on conflict do nothing;

insert into public.rtos (name) values
  ('ACMC'), ('ATR'), ('Bard'), ('VETA'), ('SCBM'), ('EWC')
on conflict do nothing;
