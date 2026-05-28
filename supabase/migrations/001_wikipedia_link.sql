-- Adds Wikipedia identity fields to profiles.
-- Run this in the Supabase SQL editor after schema.sql.

alter table public.profiles
  add column if not exists wiki_username  text,
  add column if not exists wiki_userid    text,
  add column if not exists wiki_editcount int,
  add column if not exists wiki_registered timestamptz;
