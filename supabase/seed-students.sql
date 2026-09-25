-- =========================================================================
-- DETECTRIX 2026 - SEED 25 STUDENT TEAMS INTO SUPABASE
-- Run this in your Supabase Dashboard: SQL Editor -> Run
-- =========================================================================

-- Ensure index on email and reg_no for instant login queries
create index if not exists idx_teams_leader_reg_no on public.teams(leader_reg_no);
create index if not exists idx_teams_leader_email on public.teams(leader_email);

insert into public.teams (
  id,
  name,
  leader_name,
  leader_reg_no,
  leader_email,
  members,
  pin_hash,
  disabled
) values
  ('DTX-01', 'NEXA SQUAD', 'Sowmya.P', '73152513160', 'sowmyapcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Sowmya.P","reg_no":"73152513160"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:Ybo7nUFUIlZzmTLtgkbKSUi4wEBUZQjjrDvETMZFDV4', false),
  ('DTX-02', 'HackHive', 'RAMASHREE V', '73152513134', 'ramashreevcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"RAMASHREE V","reg_no":"73152513134"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:bBTjOFsfwIh5WTKeMwbP_ETwRggAT8Z20JXvnEk0Hho', false),
  ('DTX-03', 'Code Titens', 'Senthilkumar E', '73152513153', 'senthilkumarecse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Senthilkumar E","reg_no":"73152513153"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:ZXEe0T4OEPlGhw8R4BMhyqtUbUPHeR0blnzACoBM5mc', false),
  ('DTX-04', 'TechTrace', 'Udhayasri S', '73152513177', 'udhayasriscse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Udhayasri S","reg_no":"73152513177"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:_LI0d1-SfYK2IXySikxaHKtXCg4LfosoHvryhYo00gE', false),
  ('DTX-05', 'Straw hat coders', 'Gukulnath.N', '73152513045', 'gukulnathn25_26@ksrce.ac.in', '[{"role":"Leader","name":"Gukulnath.N","reg_no":"73152513045"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:NINNNQ2UDg3ye0g-W1BnuB2sI5N2WUUt3Jw4uNn2rH8', false),
  ('DTX-06', 'Eagle Blades', 'RITHISH', '73152513141', 'rithishgcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"RITHISH","reg_no":"73152513141"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:6VGjr4iT09TD-fFDf9mUcV7SOJXNZqGFBijDTQ2nlI4', false),
  ('DTX-07', 'Data defenders', 'Praveen kumar S', '73152513128', 'praveenkumarscse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Praveen kumar S","reg_no":"73152513128"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:mOpBDeGL0Pq4AaL_wIHdi3_e8J9jwMziWhabXr8w2cQ', false),
  ('DTX-08', 'Vision Vanguard', 'Subikshan', '73152513165', 'subikshanscse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Subikshan","reg_no":"73152513165"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:43yoVZ59HapCFENkcKSYZQezJr5WDVu7EU8hQysyGpg', false),
  ('DTX-09', 'Tech Innovators', 'Kaviya E', '73152513072', 'kaviyaecse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Kaviya E","reg_no":"73152513072"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:u2QmAiZii6oJZJYW1VeXm5n2Zrgf00x3RJsyuKZ0VKM', false),
  ('DTX-10', 'The  Astros', 'Kavya Shree.P', '73152513074', 'kavyashreepcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Kavya Shree.P","reg_no":"73152513074"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:0bFPj0HlxGWV-k8BzA4hAMDEtLzVxobJJ7fYWqYpaoM', false),
  ('DTX-11', 'Brain Spark', 'Prasanna K', '73152513506', 'prasannakcse2529@ksrce.ac.in', '[{"role":"Leader","name":"Prasanna K","reg_no":"73152513506"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:FXEc_QZPFjF-SpzfPQTgeqSL7q-QnUyIGkWYkuzXKMo', false),
  ('DTX-12', 'POWER HOUSE', 'Poovendhan S', '73152513123', 'poovendhanscse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Poovendhan S","reg_no":"73152513123"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:TfHd6d6Ld2WjAd3veM255SLDiAmCs6Kn5Y_bVhg3df0', false),
  ('DTX-13', 'Future model', 'Niranjan T', '73152513113', 'niranjantcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Niranjan T","reg_no":"73152513113"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:G1VRVzysCjjQ1mCRUmv8YOBvE9J8eKWrVMZ-hFuFZKU', false),
  ('DTX-14', 'Teen Wolfes', 'Bathrinath', '73152513015', 'bathrinathmcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Bathrinath","reg_no":"73152513015"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:i9FUGZZIZ8Weu98Igctv1MG_aCcsiN8uNCar08Ti_vM', false),
  ('DTX-15', 'QUANTUM CODERS', 'BALAJI.P', '73152513013', 'balajipcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"BALAJI.P","reg_no":"73152513013"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:ciggQLLlJyLsnzA9n61tOP12aiFuiWl800OBZDAsUFo', false),
  ('DTX-16', 'Tricky Trio''s', 'Kirthishkumar S', '73152513079', 'kirthishkumarscse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Kirthishkumar S","reg_no":"73152513079"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:DuMYRswhfdXuEDQ7VmHJjxAzJoUcWvJX96t4iBpvrbo', false),
  ('DTX-17', 'Tech Titans', 'Nithuna M', '73152513117', 'nithunamcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Nithuna M","reg_no":"73152513117"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:Ht6UXApX5cPShiRhIVIRPbgP8XJNGOtTLQ8HiVDxKFs', false),
  ('DTX-18', 'Fighters', 'Santhosh S', '73152513148', 'santhoshscse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Santhosh S","reg_no":"73152513148"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:eJZc-qFUAsd39WfgUQaFdXmKoYPifI3pynqSUJWAAAw', false),
  ('DTX-19', 'SparkSync', 'Mohana S', '73152513100', 'mohanascse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Mohana S","reg_no":"73152513100"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:gRAXPjD6v92ALWaukjFY11167S5ObzUYSX_i2PTYi0Q', false),
  ('DTX-20', 'AI Avengers', 'Nirmal Raj S', '73152513114', 'nirmalrajscse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Nirmal Raj S","reg_no":"73152513114"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:o9oxl50TGc4yCPP8wDNmwkPwvUwyViYMK-KQ73dj7ac', false),
  ('DTX-21', 'TEAM HACK', 'Santhosh D', '73152513149', 'santhoshdcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Santhosh D","reg_no":"73152513149"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:gHeVrwtNxEB7l5X2GBEHoTfeweNl0EL6BxrJxrqUc-o', false),
  ('DTX-22', 'TEAM BABY', 'Kesavan K', '73152513077', 'kesavankcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Kesavan K","reg_no":"73152513077"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:YtbhbYpsYy1FxvUSFBVQl1CwqMk0iCuL_iyyorS4L80', false),
  ('DTX-23', 'Debuggers', 'Kishore A', '73152513082', 'kishoreacse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Kishore A","reg_no":"73152513082"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:gN3c7tioG1mC3p4AmitvE9GExwm9dk7vKbEmAcOyBeI', false),
  ('DTX-24', 'Binary Builders', 'Nishanth B.R', '73152513115', 'nishanthbrcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Nishanth B.R","reg_no":"73152513115"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:lyQCkhYIL1zFpEs-_197HiD7NCoeE5XhY1OxtL4CNmA', false),
  ('DTX-25', 'TEAM INNOVATORS', 'Deepan.M', '73152513028', 'deepanmcse25_29@ksrce.ac.in', '[{"role":"Leader","name":"Deepan.M","reg_no":"73152513028"}]'::jsonb, 'TEST_SALT_16_BYTES_ABC:4jKvvFbB6GcoJfHLL7fDetlKkeDgVWYCPadNNcp7Jco', false)
on conflict (id) do update set
  name = excluded.name,
  leader_name = excluded.leader_name,
  leader_reg_no = excluded.leader_reg_no,
  leader_email = excluded.leader_email,
  members = excluded.members,
  pin_hash = excluded.pin_hash,
  disabled = excluded.disabled;

-- Confirmation
select count(*) as seeded_teams_count from public.teams;
