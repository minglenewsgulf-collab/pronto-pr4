-- PRONTO PR: create export enum types only
-- Run this first if the missing-table script fails with:
-- type "public.export_format" does not exist
--
-- PostgreSQL/Supabase does not reliably support CREATE TYPE IF NOT EXISTS for
-- enum types without a procedural block. Because this script must not use DO
-- blocks, it uses plain CREATE TYPE statements.
--
-- If Supabase says one of these types already exists, stop and run only the
-- missing-table script instead.

create type public.export_format as enum ('xlsx');

create type public.export_status as enum ('pending', 'processing', 'ready', 'failed');
