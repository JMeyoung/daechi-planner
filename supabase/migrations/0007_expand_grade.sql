-- Expand grade to include high school: 4=고1, 5=고2, 6=고3
alter table public.child_profiles
  drop constraint if exists child_profiles_grade_check;
alter table public.child_profiles
  add constraint child_profiles_grade_check check (grade in (1, 2, 3, 4, 5, 6));

alter table public.profiles
  drop constraint if exists profiles_child_grade_check;
alter table public.profiles
  add constraint profiles_child_grade_check check (child_grade between 1 and 6);
