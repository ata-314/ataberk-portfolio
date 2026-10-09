-- A salted, truncated hash of the visitor's IP: tells "same network" from "elsewhere"
-- when one personal link is opened on several browsers, without storing the IP.
alter table visits add column if not exists network text;
