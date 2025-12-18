drop extension if exists "citext";

drop extension if exists "pg_net";

drop trigger if exists "enforce_comment_rate_limit_trigger" on "public"."catch_comments";

drop trigger if exists "trg_catch_comments_set_updated_at" on "public"."catch_comments";

drop trigger if exists "enforce_catch_rate_limit_trigger" on "public"."catches";

drop trigger if exists "trg_catches_set_updated_at" on "public"."catches";

drop trigger if exists "trg_enforce_catch_moderation" on "public"."catches";

drop trigger if exists "trg_profiles_set_updated_at" on "public"."profiles";

drop trigger if exists "enforce_report_rate_limit_trigger" on "public"."reports";

drop trigger if exists "trg_sessions_set_updated_at" on "public"."sessions";

drop policy "admin_users_select_all" on "public"."admin_users";

drop policy "admin_users_self_select" on "public"."admin_users";

drop policy "baits_select_all" on "public"."baits";

drop policy "catch_comments_admin_read_all" on "public"."catch_comments";

drop policy "catch_comments_admin_update" on "public"."catch_comments";

drop policy "catch_comments_insert_viewable" on "public"."catch_comments";

drop policy "catch_comments_public_read" on "public"."catch_comments";

drop policy "catch_comments_select_viewable" on "public"."catch_comments";

drop policy "catch_comments_update_owner" on "public"."catch_comments";

drop policy "catch_reactions_owner_all" on "public"."catch_reactions";

drop policy "catch_reactions_select_viewable" on "public"."catch_reactions";

drop policy "catch_reactions_write_visible_unblocked_ins" on "public"."catch_reactions";

drop policy "catch_reactions_write_visible_unblocked_upd" on "public"."catch_reactions";

drop policy "catches_admin_read_all" on "public"."catches";

drop policy "catches_owner_all" on "public"."catches";

drop policy "catches_owner_mutate" on "public"."catches";

drop policy "catches_owner_update_delete" on "public"."catches";

drop policy "catches_public_read" on "public"."catches";

drop policy "moderation_log_admin_read" on "public"."moderation_log";

drop policy "notifications_admin_read" on "public"."notifications";

drop policy "notifications_recipient_only" on "public"."notifications";

drop policy "profile_blocks_delete_admin_all" on "public"."profile_blocks";

drop policy "profile_blocks_delete_self" on "public"."profile_blocks";

drop policy "profile_blocks_insert_admin_all" on "public"."profile_blocks";

drop policy "profile_blocks_insert_self" on "public"."profile_blocks";

drop policy "profile_blocks_select_admin_all" on "public"."profile_blocks";

drop policy "profile_blocks_select_self_or_blocked" on "public"."profile_blocks";

drop policy "profile_follows_admin_select_all" on "public"."profile_follows";

drop policy "profile_follows_insert_not_blocked" on "public"."profile_follows";

drop policy "profile_follows_owner_all" on "public"."profile_follows";

drop policy "profile_follows_select_related" on "public"."profile_follows";

drop policy "profiles_select_all" on "public"."profiles";

drop policy "profiles_update_self" on "public"."profiles";

drop policy "rate_limits_admin_select" on "public"."rate_limits";

drop policy "rate_limits_self_insert" on "public"."rate_limits";

drop policy "ratings_owner_mutate" on "public"."ratings";

drop policy "ratings_read_visible_catches" on "public"."ratings";

drop policy "ratings_write_visible_unblocked_ins" on "public"."ratings";

drop policy "ratings_write_visible_unblocked_upd" on "public"."ratings";

drop policy "reports_admin_all" on "public"."reports";

drop policy "reports_owner_all" on "public"."reports";

drop policy "sessions_modify_own" on "public"."sessions";

drop policy "sessions_select_own" on "public"."sessions";

drop policy "tags_select_all" on "public"."tags";

drop policy "user_warnings_admin_read" on "public"."user_warnings";

drop policy "venue_events_select_published" on "public"."venue_events";

drop policy "venue_owners_admin_all" on "public"."venue_owners";

drop policy "venue_owners_self_select" on "public"."venue_owners";

drop policy "venue_photos_delete" on "public"."venue_photos";

drop policy "venue_photos_insert" on "public"."venue_photos";

drop policy "venue_photos_select" on "public"."venue_photos";

drop policy "Admins can select all venue ratings" on "public"."venue_ratings";

drop policy "Allow users to delete own venue ratings" on "public"."venue_ratings";

drop policy "Allow users to insert own venue ratings" on "public"."venue_ratings";

drop policy "Allow users to select own venue ratings" on "public"."venue_ratings";

drop policy "Allow users to update own venue ratings" on "public"."venue_ratings";

drop policy "venues_insert_admin_only" on "public"."venues";

drop policy "venues_select_admin_all" on "public"."venues";

drop policy "venues_select_owner" on "public"."venues";

drop policy "venues_select_published" on "public"."venues";

drop policy "venues_update_admin_all" on "public"."venues";

drop policy "venues_update_owner" on "public"."venues";

drop policy "water_types_select_all" on "public"."water_types";

revoke delete on table "public"."admin_users" from "anon";

revoke insert on table "public"."admin_users" from "anon";

revoke references on table "public"."admin_users" from "anon";

revoke select on table "public"."admin_users" from "anon";

revoke trigger on table "public"."admin_users" from "anon";

revoke truncate on table "public"."admin_users" from "anon";

revoke update on table "public"."admin_users" from "anon";

revoke delete on table "public"."admin_users" from "authenticated";

revoke insert on table "public"."admin_users" from "authenticated";

revoke references on table "public"."admin_users" from "authenticated";

revoke select on table "public"."admin_users" from "authenticated";

revoke trigger on table "public"."admin_users" from "authenticated";

revoke truncate on table "public"."admin_users" from "authenticated";

revoke update on table "public"."admin_users" from "authenticated";

revoke delete on table "public"."admin_users" from "service_role";

revoke insert on table "public"."admin_users" from "service_role";

revoke references on table "public"."admin_users" from "service_role";

revoke select on table "public"."admin_users" from "service_role";

revoke trigger on table "public"."admin_users" from "service_role";

revoke truncate on table "public"."admin_users" from "service_role";

revoke update on table "public"."admin_users" from "service_role";

revoke delete on table "public"."baits" from "anon";

revoke insert on table "public"."baits" from "anon";

revoke references on table "public"."baits" from "anon";

revoke select on table "public"."baits" from "anon";

revoke trigger on table "public"."baits" from "anon";

revoke truncate on table "public"."baits" from "anon";

revoke update on table "public"."baits" from "anon";

revoke delete on table "public"."baits" from "authenticated";

revoke insert on table "public"."baits" from "authenticated";

revoke references on table "public"."baits" from "authenticated";

revoke select on table "public"."baits" from "authenticated";

revoke trigger on table "public"."baits" from "authenticated";

revoke truncate on table "public"."baits" from "authenticated";

revoke update on table "public"."baits" from "authenticated";

revoke delete on table "public"."baits" from "service_role";

revoke insert on table "public"."baits" from "service_role";

revoke references on table "public"."baits" from "service_role";

revoke select on table "public"."baits" from "service_role";

revoke trigger on table "public"."baits" from "service_role";

revoke truncate on table "public"."baits" from "service_role";

revoke update on table "public"."baits" from "service_role";

revoke delete on table "public"."catch_comments" from "anon";

revoke insert on table "public"."catch_comments" from "anon";

revoke references on table "public"."catch_comments" from "anon";

revoke select on table "public"."catch_comments" from "anon";

revoke trigger on table "public"."catch_comments" from "anon";

revoke truncate on table "public"."catch_comments" from "anon";

revoke update on table "public"."catch_comments" from "anon";

revoke delete on table "public"."catch_comments" from "authenticated";

revoke insert on table "public"."catch_comments" from "authenticated";

revoke references on table "public"."catch_comments" from "authenticated";

revoke select on table "public"."catch_comments" from "authenticated";

revoke trigger on table "public"."catch_comments" from "authenticated";

revoke truncate on table "public"."catch_comments" from "authenticated";

revoke update on table "public"."catch_comments" from "authenticated";

revoke delete on table "public"."catch_comments" from "service_role";

revoke insert on table "public"."catch_comments" from "service_role";

revoke references on table "public"."catch_comments" from "service_role";

revoke select on table "public"."catch_comments" from "service_role";

revoke trigger on table "public"."catch_comments" from "service_role";

revoke truncate on table "public"."catch_comments" from "service_role";

revoke update on table "public"."catch_comments" from "service_role";

revoke delete on table "public"."catch_reactions" from "anon";

revoke insert on table "public"."catch_reactions" from "anon";

revoke references on table "public"."catch_reactions" from "anon";

revoke select on table "public"."catch_reactions" from "anon";

revoke trigger on table "public"."catch_reactions" from "anon";

revoke truncate on table "public"."catch_reactions" from "anon";

revoke update on table "public"."catch_reactions" from "anon";

revoke delete on table "public"."catch_reactions" from "authenticated";

revoke insert on table "public"."catch_reactions" from "authenticated";

revoke references on table "public"."catch_reactions" from "authenticated";

revoke select on table "public"."catch_reactions" from "authenticated";

revoke trigger on table "public"."catch_reactions" from "authenticated";

revoke truncate on table "public"."catch_reactions" from "authenticated";

revoke update on table "public"."catch_reactions" from "authenticated";

revoke delete on table "public"."catch_reactions" from "service_role";

revoke insert on table "public"."catch_reactions" from "service_role";

revoke references on table "public"."catch_reactions" from "service_role";

revoke select on table "public"."catch_reactions" from "service_role";

revoke trigger on table "public"."catch_reactions" from "service_role";

revoke truncate on table "public"."catch_reactions" from "service_role";

revoke update on table "public"."catch_reactions" from "service_role";

revoke delete on table "public"."catches" from "anon";

revoke insert on table "public"."catches" from "anon";

revoke references on table "public"."catches" from "anon";

revoke select on table "public"."catches" from "anon";

revoke trigger on table "public"."catches" from "anon";

revoke truncate on table "public"."catches" from "anon";

revoke update on table "public"."catches" from "anon";

revoke delete on table "public"."catches" from "authenticated";

revoke insert on table "public"."catches" from "authenticated";

revoke references on table "public"."catches" from "authenticated";

revoke select on table "public"."catches" from "authenticated";

revoke trigger on table "public"."catches" from "authenticated";

revoke truncate on table "public"."catches" from "authenticated";

revoke update on table "public"."catches" from "authenticated";

revoke delete on table "public"."catches" from "service_role";

revoke insert on table "public"."catches" from "service_role";

revoke references on table "public"."catches" from "service_role";

revoke select on table "public"."catches" from "service_role";

revoke trigger on table "public"."catches" from "service_role";

revoke truncate on table "public"."catches" from "service_role";

revoke update on table "public"."catches" from "service_role";

revoke delete on table "public"."moderation_log" from "anon";

revoke insert on table "public"."moderation_log" from "anon";

revoke references on table "public"."moderation_log" from "anon";

revoke select on table "public"."moderation_log" from "anon";

revoke trigger on table "public"."moderation_log" from "anon";

revoke truncate on table "public"."moderation_log" from "anon";

revoke update on table "public"."moderation_log" from "anon";

revoke delete on table "public"."moderation_log" from "authenticated";

revoke insert on table "public"."moderation_log" from "authenticated";

revoke references on table "public"."moderation_log" from "authenticated";

revoke select on table "public"."moderation_log" from "authenticated";

revoke trigger on table "public"."moderation_log" from "authenticated";

revoke truncate on table "public"."moderation_log" from "authenticated";

revoke update on table "public"."moderation_log" from "authenticated";

revoke delete on table "public"."moderation_log" from "service_role";

revoke insert on table "public"."moderation_log" from "service_role";

revoke references on table "public"."moderation_log" from "service_role";

revoke select on table "public"."moderation_log" from "service_role";

revoke trigger on table "public"."moderation_log" from "service_role";

revoke truncate on table "public"."moderation_log" from "service_role";

revoke update on table "public"."moderation_log" from "service_role";

revoke delete on table "public"."notifications" from "anon";

revoke insert on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke trigger on table "public"."notifications" from "anon";

revoke truncate on table "public"."notifications" from "anon";

revoke update on table "public"."notifications" from "anon";

revoke delete on table "public"."notifications" from "authenticated";

revoke insert on table "public"."notifications" from "authenticated";

revoke references on table "public"."notifications" from "authenticated";

revoke select on table "public"."notifications" from "authenticated";

revoke trigger on table "public"."notifications" from "authenticated";

revoke truncate on table "public"."notifications" from "authenticated";

revoke update on table "public"."notifications" from "authenticated";

revoke delete on table "public"."notifications" from "service_role";

revoke insert on table "public"."notifications" from "service_role";

revoke references on table "public"."notifications" from "service_role";

revoke select on table "public"."notifications" from "service_role";

revoke trigger on table "public"."notifications" from "service_role";

revoke truncate on table "public"."notifications" from "service_role";

revoke update on table "public"."notifications" from "service_role";

revoke delete on table "public"."profile_blocks" from "anon";

revoke insert on table "public"."profile_blocks" from "anon";

revoke references on table "public"."profile_blocks" from "anon";

revoke select on table "public"."profile_blocks" from "anon";

revoke trigger on table "public"."profile_blocks" from "anon";

revoke truncate on table "public"."profile_blocks" from "anon";

revoke update on table "public"."profile_blocks" from "anon";

revoke delete on table "public"."profile_blocks" from "authenticated";

revoke insert on table "public"."profile_blocks" from "authenticated";

revoke references on table "public"."profile_blocks" from "authenticated";

revoke select on table "public"."profile_blocks" from "authenticated";

revoke trigger on table "public"."profile_blocks" from "authenticated";

revoke truncate on table "public"."profile_blocks" from "authenticated";

revoke update on table "public"."profile_blocks" from "authenticated";

revoke delete on table "public"."profile_blocks" from "service_role";

revoke insert on table "public"."profile_blocks" from "service_role";

revoke references on table "public"."profile_blocks" from "service_role";

revoke select on table "public"."profile_blocks" from "service_role";

revoke trigger on table "public"."profile_blocks" from "service_role";

revoke truncate on table "public"."profile_blocks" from "service_role";

revoke update on table "public"."profile_blocks" from "service_role";

revoke delete on table "public"."profile_follows" from "anon";

revoke insert on table "public"."profile_follows" from "anon";

revoke references on table "public"."profile_follows" from "anon";

revoke select on table "public"."profile_follows" from "anon";

revoke trigger on table "public"."profile_follows" from "anon";

revoke truncate on table "public"."profile_follows" from "anon";

revoke update on table "public"."profile_follows" from "anon";

revoke delete on table "public"."profile_follows" from "authenticated";

revoke insert on table "public"."profile_follows" from "authenticated";

revoke references on table "public"."profile_follows" from "authenticated";

revoke select on table "public"."profile_follows" from "authenticated";

revoke trigger on table "public"."profile_follows" from "authenticated";

revoke truncate on table "public"."profile_follows" from "authenticated";

revoke update on table "public"."profile_follows" from "authenticated";

revoke delete on table "public"."profile_follows" from "service_role";

revoke insert on table "public"."profile_follows" from "service_role";

revoke references on table "public"."profile_follows" from "service_role";

revoke select on table "public"."profile_follows" from "service_role";

revoke trigger on table "public"."profile_follows" from "service_role";

revoke truncate on table "public"."profile_follows" from "service_role";

revoke update on table "public"."profile_follows" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."rate_limits" from "anon";

revoke insert on table "public"."rate_limits" from "anon";

revoke references on table "public"."rate_limits" from "anon";

revoke select on table "public"."rate_limits" from "anon";

revoke trigger on table "public"."rate_limits" from "anon";

revoke truncate on table "public"."rate_limits" from "anon";

revoke update on table "public"."rate_limits" from "anon";

revoke delete on table "public"."rate_limits" from "authenticated";

revoke insert on table "public"."rate_limits" from "authenticated";

revoke references on table "public"."rate_limits" from "authenticated";

revoke select on table "public"."rate_limits" from "authenticated";

revoke trigger on table "public"."rate_limits" from "authenticated";

revoke truncate on table "public"."rate_limits" from "authenticated";

revoke update on table "public"."rate_limits" from "authenticated";

revoke delete on table "public"."rate_limits" from "service_role";

revoke insert on table "public"."rate_limits" from "service_role";

revoke references on table "public"."rate_limits" from "service_role";

revoke select on table "public"."rate_limits" from "service_role";

revoke trigger on table "public"."rate_limits" from "service_role";

revoke truncate on table "public"."rate_limits" from "service_role";

revoke update on table "public"."rate_limits" from "service_role";

revoke delete on table "public"."ratings" from "anon";

revoke insert on table "public"."ratings" from "anon";

revoke references on table "public"."ratings" from "anon";

revoke select on table "public"."ratings" from "anon";

revoke trigger on table "public"."ratings" from "anon";

revoke truncate on table "public"."ratings" from "anon";

revoke update on table "public"."ratings" from "anon";

revoke delete on table "public"."ratings" from "authenticated";

revoke insert on table "public"."ratings" from "authenticated";

revoke references on table "public"."ratings" from "authenticated";

revoke select on table "public"."ratings" from "authenticated";

revoke trigger on table "public"."ratings" from "authenticated";

revoke truncate on table "public"."ratings" from "authenticated";

revoke update on table "public"."ratings" from "authenticated";

revoke delete on table "public"."ratings" from "service_role";

revoke insert on table "public"."ratings" from "service_role";

revoke references on table "public"."ratings" from "service_role";

revoke select on table "public"."ratings" from "service_role";

revoke trigger on table "public"."ratings" from "service_role";

revoke truncate on table "public"."ratings" from "service_role";

revoke update on table "public"."ratings" from "service_role";

revoke delete on table "public"."reports" from "anon";

revoke insert on table "public"."reports" from "anon";

revoke references on table "public"."reports" from "anon";

revoke select on table "public"."reports" from "anon";

revoke trigger on table "public"."reports" from "anon";

revoke truncate on table "public"."reports" from "anon";

revoke update on table "public"."reports" from "anon";

revoke delete on table "public"."reports" from "authenticated";

revoke insert on table "public"."reports" from "authenticated";

revoke references on table "public"."reports" from "authenticated";

revoke select on table "public"."reports" from "authenticated";

revoke trigger on table "public"."reports" from "authenticated";

revoke truncate on table "public"."reports" from "authenticated";

revoke update on table "public"."reports" from "authenticated";

revoke delete on table "public"."reports" from "service_role";

revoke insert on table "public"."reports" from "service_role";

revoke references on table "public"."reports" from "service_role";

revoke select on table "public"."reports" from "service_role";

revoke trigger on table "public"."reports" from "service_role";

revoke truncate on table "public"."reports" from "service_role";

revoke update on table "public"."reports" from "service_role";

revoke delete on table "public"."sessions" from "anon";

revoke insert on table "public"."sessions" from "anon";

revoke references on table "public"."sessions" from "anon";

revoke select on table "public"."sessions" from "anon";

revoke trigger on table "public"."sessions" from "anon";

revoke truncate on table "public"."sessions" from "anon";

revoke update on table "public"."sessions" from "anon";

revoke delete on table "public"."sessions" from "authenticated";

revoke insert on table "public"."sessions" from "authenticated";

revoke references on table "public"."sessions" from "authenticated";

revoke select on table "public"."sessions" from "authenticated";

revoke trigger on table "public"."sessions" from "authenticated";

revoke truncate on table "public"."sessions" from "authenticated";

revoke update on table "public"."sessions" from "authenticated";

revoke delete on table "public"."sessions" from "service_role";

revoke insert on table "public"."sessions" from "service_role";

revoke references on table "public"."sessions" from "service_role";

revoke select on table "public"."sessions" from "service_role";

revoke trigger on table "public"."sessions" from "service_role";

revoke truncate on table "public"."sessions" from "service_role";

revoke update on table "public"."sessions" from "service_role";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke delete on table "public"."tags" from "authenticated";

revoke insert on table "public"."tags" from "authenticated";

revoke references on table "public"."tags" from "authenticated";

revoke select on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke update on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

revoke delete on table "public"."user_warnings" from "anon";

revoke insert on table "public"."user_warnings" from "anon";

revoke references on table "public"."user_warnings" from "anon";

revoke select on table "public"."user_warnings" from "anon";

revoke trigger on table "public"."user_warnings" from "anon";

revoke truncate on table "public"."user_warnings" from "anon";

revoke update on table "public"."user_warnings" from "anon";

revoke delete on table "public"."user_warnings" from "authenticated";

revoke insert on table "public"."user_warnings" from "authenticated";

revoke references on table "public"."user_warnings" from "authenticated";

revoke select on table "public"."user_warnings" from "authenticated";

revoke trigger on table "public"."user_warnings" from "authenticated";

revoke truncate on table "public"."user_warnings" from "authenticated";

revoke update on table "public"."user_warnings" from "authenticated";

revoke delete on table "public"."user_warnings" from "service_role";

revoke insert on table "public"."user_warnings" from "service_role";

revoke references on table "public"."user_warnings" from "service_role";

revoke select on table "public"."user_warnings" from "service_role";

revoke trigger on table "public"."user_warnings" from "service_role";

revoke truncate on table "public"."user_warnings" from "service_role";

revoke update on table "public"."user_warnings" from "service_role";

revoke delete on table "public"."venue_events" from "anon";

revoke insert on table "public"."venue_events" from "anon";

revoke references on table "public"."venue_events" from "anon";

revoke select on table "public"."venue_events" from "anon";

revoke trigger on table "public"."venue_events" from "anon";

revoke truncate on table "public"."venue_events" from "anon";

revoke update on table "public"."venue_events" from "anon";

revoke delete on table "public"."venue_events" from "authenticated";

revoke insert on table "public"."venue_events" from "authenticated";

revoke references on table "public"."venue_events" from "authenticated";

revoke select on table "public"."venue_events" from "authenticated";

revoke trigger on table "public"."venue_events" from "authenticated";

revoke truncate on table "public"."venue_events" from "authenticated";

revoke update on table "public"."venue_events" from "authenticated";

revoke delete on table "public"."venue_events" from "service_role";

revoke insert on table "public"."venue_events" from "service_role";

revoke references on table "public"."venue_events" from "service_role";

revoke select on table "public"."venue_events" from "service_role";

revoke trigger on table "public"."venue_events" from "service_role";

revoke truncate on table "public"."venue_events" from "service_role";

revoke update on table "public"."venue_events" from "service_role";

revoke delete on table "public"."venue_owners" from "anon";

revoke insert on table "public"."venue_owners" from "anon";

revoke references on table "public"."venue_owners" from "anon";

revoke select on table "public"."venue_owners" from "anon";

revoke trigger on table "public"."venue_owners" from "anon";

revoke truncate on table "public"."venue_owners" from "anon";

revoke update on table "public"."venue_owners" from "anon";

revoke delete on table "public"."venue_owners" from "authenticated";

revoke insert on table "public"."venue_owners" from "authenticated";

revoke references on table "public"."venue_owners" from "authenticated";

revoke select on table "public"."venue_owners" from "authenticated";

revoke trigger on table "public"."venue_owners" from "authenticated";

revoke truncate on table "public"."venue_owners" from "authenticated";

revoke update on table "public"."venue_owners" from "authenticated";

revoke delete on table "public"."venue_owners" from "service_role";

revoke insert on table "public"."venue_owners" from "service_role";

revoke references on table "public"."venue_owners" from "service_role";

revoke select on table "public"."venue_owners" from "service_role";

revoke trigger on table "public"."venue_owners" from "service_role";

revoke truncate on table "public"."venue_owners" from "service_role";

revoke update on table "public"."venue_owners" from "service_role";

revoke delete on table "public"."venue_photos" from "anon";

revoke insert on table "public"."venue_photos" from "anon";

revoke references on table "public"."venue_photos" from "anon";

revoke select on table "public"."venue_photos" from "anon";

revoke trigger on table "public"."venue_photos" from "anon";

revoke truncate on table "public"."venue_photos" from "anon";

revoke update on table "public"."venue_photos" from "anon";

revoke delete on table "public"."venue_photos" from "authenticated";

revoke insert on table "public"."venue_photos" from "authenticated";

revoke references on table "public"."venue_photos" from "authenticated";

revoke select on table "public"."venue_photos" from "authenticated";

revoke trigger on table "public"."venue_photos" from "authenticated";

revoke truncate on table "public"."venue_photos" from "authenticated";

revoke update on table "public"."venue_photos" from "authenticated";

revoke delete on table "public"."venue_photos" from "service_role";

revoke insert on table "public"."venue_photos" from "service_role";

revoke references on table "public"."venue_photos" from "service_role";

revoke select on table "public"."venue_photos" from "service_role";

revoke trigger on table "public"."venue_photos" from "service_role";

revoke truncate on table "public"."venue_photos" from "service_role";

revoke update on table "public"."venue_photos" from "service_role";

revoke delete on table "public"."venue_ratings" from "anon";

revoke insert on table "public"."venue_ratings" from "anon";

revoke references on table "public"."venue_ratings" from "anon";

revoke select on table "public"."venue_ratings" from "anon";

revoke trigger on table "public"."venue_ratings" from "anon";

revoke truncate on table "public"."venue_ratings" from "anon";

revoke update on table "public"."venue_ratings" from "anon";

revoke delete on table "public"."venue_ratings" from "authenticated";

revoke insert on table "public"."venue_ratings" from "authenticated";

revoke references on table "public"."venue_ratings" from "authenticated";

revoke select on table "public"."venue_ratings" from "authenticated";

revoke trigger on table "public"."venue_ratings" from "authenticated";

revoke truncate on table "public"."venue_ratings" from "authenticated";

revoke update on table "public"."venue_ratings" from "authenticated";

revoke delete on table "public"."venue_ratings" from "service_role";

revoke insert on table "public"."venue_ratings" from "service_role";

revoke references on table "public"."venue_ratings" from "service_role";

revoke select on table "public"."venue_ratings" from "service_role";

revoke trigger on table "public"."venue_ratings" from "service_role";

revoke truncate on table "public"."venue_ratings" from "service_role";

revoke update on table "public"."venue_ratings" from "service_role";

revoke delete on table "public"."venues" from "anon";

revoke insert on table "public"."venues" from "anon";

revoke references on table "public"."venues" from "anon";

revoke select on table "public"."venues" from "anon";

revoke trigger on table "public"."venues" from "anon";

revoke truncate on table "public"."venues" from "anon";

revoke update on table "public"."venues" from "anon";

revoke delete on table "public"."venues" from "authenticated";

revoke insert on table "public"."venues" from "authenticated";

revoke references on table "public"."venues" from "authenticated";

revoke select on table "public"."venues" from "authenticated";

revoke trigger on table "public"."venues" from "authenticated";

revoke truncate on table "public"."venues" from "authenticated";

revoke update on table "public"."venues" from "authenticated";

revoke delete on table "public"."venues" from "service_role";

revoke insert on table "public"."venues" from "service_role";

revoke references on table "public"."venues" from "service_role";

revoke select on table "public"."venues" from "service_role";

revoke trigger on table "public"."venues" from "service_role";

revoke truncate on table "public"."venues" from "service_role";

revoke update on table "public"."venues" from "service_role";

revoke delete on table "public"."water_types" from "anon";

revoke insert on table "public"."water_types" from "anon";

revoke references on table "public"."water_types" from "anon";

revoke select on table "public"."water_types" from "anon";

revoke trigger on table "public"."water_types" from "anon";

revoke truncate on table "public"."water_types" from "anon";

revoke update on table "public"."water_types" from "anon";

revoke delete on table "public"."water_types" from "authenticated";

revoke insert on table "public"."water_types" from "authenticated";

revoke references on table "public"."water_types" from "authenticated";

revoke select on table "public"."water_types" from "authenticated";

revoke trigger on table "public"."water_types" from "authenticated";

revoke truncate on table "public"."water_types" from "authenticated";

revoke update on table "public"."water_types" from "authenticated";

revoke delete on table "public"."water_types" from "service_role";

revoke insert on table "public"."water_types" from "service_role";

revoke references on table "public"."water_types" from "service_role";

revoke select on table "public"."water_types" from "service_role";

revoke trigger on table "public"."water_types" from "service_role";

revoke truncate on table "public"."water_types" from "service_role";

revoke update on table "public"."water_types" from "service_role";

alter table "public"."admin_users" drop constraint "admin_users_user_id_fkey";

alter table "public"."catch_comments" drop constraint "catch_comments_catch_id_fkey";

alter table "public"."catch_comments" drop constraint "catch_comments_parent_comment_id_fkey";

alter table "public"."catch_comments" drop constraint "catch_comments_user_id_fkey";

alter table "public"."catch_reactions" drop constraint "catch_reactions_catch_id_fkey";

alter table "public"."catch_reactions" drop constraint "catch_reactions_user_id_fkey";

alter table "public"."catches" drop constraint "catches_session_id_fkey";

alter table "public"."catches" drop constraint "catches_user_id_fkey";

alter table "public"."catches" drop constraint "catches_venue_id_fkey";

alter table "public"."catches" drop constraint "chk_catches_length_positive";

alter table "public"."catches" drop constraint "chk_catches_weight_positive";

alter table "public"."moderation_log" drop constraint "moderation_log_admin_id_fkey";

alter table "public"."notifications" drop constraint "notifications_actor_id_fkey";

alter table "public"."notifications" drop constraint "notifications_catch_id_fkey";

alter table "public"."notifications" drop constraint "notifications_comment_id_fkey";

alter table "public"."notifications" drop constraint "notifications_user_id_fkey";

alter table "public"."notifications" drop constraint "uq_notifications_like_follow_once";

alter table "public"."profile_blocks" drop constraint "profile_blocks_blocked_id_fkey";

alter table "public"."profile_blocks" drop constraint "profile_blocks_blocker_id_fkey";

alter table "public"."profile_follows" drop constraint "chk_no_self_follow";

alter table "public"."profile_follows" drop constraint "profile_follows_follower_id_fkey";

alter table "public"."profile_follows" drop constraint "profile_follows_following_id_fkey";

alter table "public"."profiles" drop constraint "chk_profiles_username_length";

alter table "public"."profiles" drop constraint "profiles_username_key";

alter table "public"."ratings" drop constraint "ratings_catch_id_fkey";

alter table "public"."ratings" drop constraint "ratings_rating_between_1_10";

alter table "public"."ratings" drop constraint "ratings_user_id_fkey";

alter table "public"."reports" drop constraint "reports_reporter_id_fkey";

alter table "public"."reports" drop constraint "reports_reviewed_by_fkey";

alter table "public"."sessions" drop constraint "sessions_user_id_fkey";

alter table "public"."user_warnings" drop constraint "user_warnings_admin_id_fkey";

alter table "public"."user_warnings" drop constraint "user_warnings_issued_by_fkey";

alter table "public"."user_warnings" drop constraint "user_warnings_user_id_fkey";

alter table "public"."venue_events" drop constraint "venue_events_venue_id_fkey";

alter table "public"."venue_owners" drop constraint "venue_owners_user_id_fkey";

alter table "public"."venue_owners" drop constraint "venue_owners_venue_id_fkey";

alter table "public"."venue_photos" drop constraint "venue_photos_created_by_fkey";

alter table "public"."venue_photos" drop constraint "venue_photos_venue_id_fkey";

alter table "public"."venue_ratings" drop constraint "venue_ratings_rating_check";

alter table "public"."venue_ratings" drop constraint "venue_ratings_user_id_fkey";

alter table "public"."venue_ratings" drop constraint "venue_ratings_venue_id_fkey";

alter table "public"."venue_ratings" drop constraint "venue_ratings_venue_id_user_id_key";

alter table "public"."venues" drop constraint "venues_slug_key";

drop function if exists "public"."admin_add_venue_owner"(p_venue_id uuid, p_user_id uuid, p_role text);

drop function if exists "public"."admin_clear_moderation_status"(p_user_id uuid, p_reason text);

drop function if exists "public"."admin_create_venue_event"(p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean);

drop function if exists "public"."admin_delete_account"(p_target uuid, p_reason text);

drop function if exists "public"."admin_delete_catch"(p_catch_id uuid, p_reason text);

drop function if exists "public"."admin_delete_comment"(p_comment_id uuid, p_reason text);

drop function if exists "public"."admin_delete_venue_event"(p_event_id uuid);

drop function if exists "public"."admin_get_venue_events"(p_venue_id uuid);

drop function if exists "public"."admin_list_moderation_log"(p_user_id uuid, p_action text, p_search text, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer);

drop function if exists "public"."admin_list_reports"(p_status text, p_type text, p_reported_user_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_sort_direction text, p_limit integer, p_offset integer);

drop function if exists "public"."admin_remove_venue_owner"(p_venue_id uuid, p_user_id uuid);

drop function if exists "public"."admin_restore_catch"(p_catch_id uuid, p_reason text);

drop function if exists "public"."admin_restore_comment"(p_comment_id uuid, p_reason text);

drop function if exists "public"."admin_update_report_status"(p_report_id uuid, p_status text, p_resolution_notes text);

drop function if exists "public"."admin_update_venue_event"(p_event_id uuid, p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_is_published boolean);

drop function if exists "public"."admin_update_venue_metadata"(p_venue_id uuid, p_short_tagline text, p_description text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text);

drop function if exists "public"."admin_update_venue_metadata"(p_venue_id uuid, p_short_tagline text, p_ticket_type text, p_price_from text, p_best_for_tags text[], p_facilities text[], p_website_url text, p_booking_url text, p_contact_phone text, p_notes_for_rr_team text);

drop function if exists "public"."admin_warn_user"(p_user_id uuid, p_reason text, p_severity public.warning_severity, p_duration_hours integer);

drop function if exists "public"."assert_moderation_allowed"(p_user_id uuid);

drop function if exists "public"."block_profile"(p_blocked_id uuid, p_reason text);

drop view if exists "public"."catch_comments_with_admin";

drop view if exists "public"."catch_mention_candidates";

drop function if exists "public"."check_email_exists"(email_to_check text);

drop function if exists "public"."check_rate_limit"(p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer);

drop function if exists "public"."cleanup_rate_limits"();

drop function if exists "public"."create_comment_with_rate_limit"(p_catch_id uuid, p_body text, p_parent_comment_id uuid);

drop function if exists "public"."create_notification"(p_user_id uuid, p_message text, p_type public.notification_type, p_actor_id uuid, p_catch_id uuid, p_comment_id uuid, p_extra_data jsonb);

drop function if exists "public"."create_report_with_rate_limit"(p_target_type public.report_target_type, p_target_id uuid, p_reason text, p_details text);

drop function if exists "public"."enforce_catch_moderation"();

drop function if exists "public"."enforce_catch_rate_limit"();

drop function if exists "public"."enforce_comment_rate_limit"();

drop function if exists "public"."enforce_report_rate_limit"();

drop function if exists "public"."follow_profile_with_rate_limit"(p_following_id uuid);

drop function if exists "public"."get_catch_rating_summary"(p_catch_id uuid);

drop function if exists "public"."get_follower_count"(p_profile_id uuid);

drop function if exists "public"."get_my_venue_rating"(p_venue_id uuid);

drop function if exists "public"."get_rate_limit_status"(p_user_id uuid, p_action text, p_max_attempts integer, p_window_minutes integer);

drop function if exists "public"."get_venue_by_slug"(p_slug text);

drop function if exists "public"."get_venue_past_events"(p_venue_id uuid, p_now timestamp with time zone, p_limit integer, p_offset integer);

drop function if exists "public"."get_venue_photos"(p_venue_id uuid, p_limit integer, p_offset integer);

drop function if exists "public"."get_venue_recent_catches"(p_venue_id uuid, p_limit integer, p_offset integer);

drop function if exists "public"."get_venue_top_anglers"(p_venue_id uuid, p_limit integer);

drop function if exists "public"."get_venue_top_catches"(p_venue_id uuid, p_limit integer);

drop function if exists "public"."get_venue_upcoming_events"(p_venue_id uuid, p_now timestamp with time zone, p_limit integer);

drop function if exists "public"."get_venues"(p_search text, p_limit integer, p_offset integer);

drop function if exists "public"."handle_new_user"();

drop function if exists "public"."is_following"(p_follower uuid, p_following uuid);

drop function if exists "public"."is_venue_admin_or_owner"(p_venue_id uuid);

drop view if exists "public"."leaderboard_scores_detailed";

drop function if exists "public"."owner_add_venue_photo"(p_venue_id uuid, p_image_path text, p_caption text);

drop function if exists "public"."owner_create_venue_event"(p_venue_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean);

drop function if exists "public"."owner_delete_venue_event"(p_event_id uuid);

drop function if exists "public"."owner_delete_venue_photo"(p_id uuid);

drop function if exists "public"."owner_get_venue_events"(p_venue_id uuid);

drop function if exists "public"."owner_update_venue_event"(p_event_id uuid, p_title text, p_event_type text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_description text, p_ticket_info text, p_website_url text, p_booking_url text, p_contact_phone text, p_is_published boolean);

drop function if exists "public"."owner_update_venue_metadata"(p_venue_id uuid, p_tagline text, p_description text, p_ticket_type text, p_best_for_tags text[], p_facilities text[], p_price_from text, p_website_url text, p_booking_url text, p_contact_phone text);

drop function if exists "public"."rate_catch_with_rate_limit"(p_catch_id uuid, p_rating integer);

drop function if exists "public"."react_to_catch_with_rate_limit"(p_catch_id uuid, p_reaction text);

drop function if exists "public"."request_account_deletion"(p_reason text);

drop function if exists "public"."request_account_export"();

drop function if exists "public"."set_updated_at"();

drop function if exists "public"."soft_delete_comment"(p_comment_id uuid);

drop function if exists "public"."unblock_profile"(p_blocked_id uuid);

drop function if exists "public"."upsert_venue_rating"(p_venue_id uuid, p_rating integer);

drop function if exists "public"."user_rate_limits"();

drop function if exists "public"."user_rate_limits"(p_user_id uuid);

drop view if exists "public"."venue_stats";

drop function if exists "public"."is_admin"(p_user_id uuid);

drop function if exists "public"."is_blocked_either_way"(p_user_id uuid, p_other_id uuid);

alter table "public"."admin_users" drop constraint "admin_users_pkey";

alter table "public"."baits" drop constraint "baits_pkey";

alter table "public"."catch_comments" drop constraint "catch_comments_pkey";

alter table "public"."catch_reactions" drop constraint "catch_reactions_pkey";

alter table "public"."catches" drop constraint "catches_pkey";

alter table "public"."moderation_log" drop constraint "moderation_log_pkey";

alter table "public"."notifications" drop constraint "notifications_pkey";

alter table "public"."profile_blocks" drop constraint "profile_blocks_pkey";

alter table "public"."profile_follows" drop constraint "profile_follows_pkey";

alter table "public"."profiles" drop constraint "profiles_pkey";

alter table "public"."rate_limits" drop constraint "rate_limits_pkey";

alter table "public"."ratings" drop constraint "ratings_pkey";

alter table "public"."reports" drop constraint "reports_pkey";

alter table "public"."sessions" drop constraint "sessions_pkey";

alter table "public"."tags" drop constraint "tags_pkey";

alter table "public"."user_warnings" drop constraint "user_warnings_pkey";

alter table "public"."venue_events" drop constraint "venue_events_pkey";

alter table "public"."venue_owners" drop constraint "venue_owners_pkey";

alter table "public"."venue_photos" drop constraint "venue_photos_pkey";

alter table "public"."venue_ratings" drop constraint "venue_ratings_pkey";

alter table "public"."venues" drop constraint "venues_pkey";

alter table "public"."water_types" drop constraint "water_types_pkey";

drop index if exists "public"."admin_users_pkey";

drop index if exists "public"."baits_pkey";

drop index if exists "public"."catch_comments_pkey";

drop index if exists "public"."catch_reactions_pkey";

drop index if exists "public"."catches_pkey";

drop index if exists "public"."idx_catch_comments_catch_id";

drop index if exists "public"."idx_catch_comments_catch_parent_created";

drop index if exists "public"."idx_catch_comments_user_id";

drop index if exists "public"."idx_catches_created_deleted_visibility";

drop index if exists "public"."idx_catches_session_id";

drop index if exists "public"."idx_catches_user_id";

drop index if exists "public"."idx_catches_venue_created_at";

drop index if exists "public"."idx_catches_venue_weight";

drop index if exists "public"."idx_moderation_log_action_created";

drop index if exists "public"."idx_notifications_user_created";

drop index if exists "public"."idx_profile_blocks_blocked_id";

drop index if exists "public"."idx_profile_blocks_blocker_id";

drop index if exists "public"."idx_profiles_deleted_at";

drop index if exists "public"."idx_profiles_is_deleted";

drop index if exists "public"."idx_profiles_is_private";

drop index if exists "public"."idx_profiles_username";

drop index if exists "public"."idx_rate_limits_user_action_created";

drop index if exists "public"."idx_reports_status_created";

drop index if exists "public"."idx_reports_target";

drop index if exists "public"."idx_sessions_user_date";

drop index if exists "public"."idx_venue_events_starts_at";

drop index if exists "public"."idx_venue_events_venue_starts_at";

drop index if exists "public"."idx_venue_owners_user_id";

drop index if exists "public"."idx_venue_owners_venue_id";

drop index if exists "public"."idx_venues_is_published";

drop index if exists "public"."idx_venues_name";

drop index if exists "public"."idx_venues_slug";

drop index if exists "public"."moderation_log_pkey";

drop index if exists "public"."notifications_pkey";

drop index if exists "public"."profile_blocks_pkey";

drop index if exists "public"."profile_follows_pkey";

drop index if exists "public"."profiles_pkey";

drop index if exists "public"."profiles_username_key";

drop index if exists "public"."rate_limits_pkey";

drop index if exists "public"."ratings_pkey";

drop index if exists "public"."reports_pkey";

drop index if exists "public"."sessions_pkey";

drop index if exists "public"."tags_pkey";

drop index if exists "public"."uq_catch_reactions_user_catch";

drop index if exists "public"."uq_notifications_like_follow_once";

drop index if exists "public"."uq_profile_follows_pair";

drop index if exists "public"."uq_ratings_user_catch";

drop index if exists "public"."user_warnings_pkey";

drop index if exists "public"."venue_events_pkey";

drop index if exists "public"."venue_owners_pkey";

drop index if exists "public"."venue_photos_pkey";

drop index if exists "public"."venue_ratings_pkey";

drop index if exists "public"."venue_ratings_user_venue_idx";

drop index if exists "public"."venue_ratings_venue_id_idx";

drop index if exists "public"."venue_ratings_venue_id_user_id_key";

drop index if exists "public"."venues_pkey";

drop index if exists "public"."venues_slug_key";

drop index if exists "public"."water_types_pkey";

drop table "public"."admin_users";

drop table "public"."baits";

drop table "public"."catch_comments";

drop table "public"."catch_reactions";

drop table "public"."catches";

drop table "public"."moderation_log";

drop table "public"."notifications";

drop table "public"."profile_blocks";

drop table "public"."profile_follows";

drop table "public"."profiles";

drop table "public"."rate_limits";

drop table "public"."ratings";

drop table "public"."reports";

drop table "public"."sessions";

drop table "public"."tags";

drop table "public"."user_warnings";

drop table "public"."venue_events";

drop table "public"."venue_owners";

drop table "public"."venue_photos";

drop table "public"."venue_ratings";

drop table "public"."venues";

drop table "public"."water_types";

drop sequence if exists "public"."rate_limits_id_seq";

drop type "public"."length_unit";

drop type "public"."mod_action";

drop type "public"."notification_type";

drop type "public"."reaction_type";

drop type "public"."report_status";

drop type "public"."report_target_type";

drop type "public"."time_of_day";

drop type "public"."visibility_type";

drop type "public"."warning_severity";

drop type "public"."weight_unit";

drop trigger if exists "on_auth_user_created" on "auth"."users";

drop policy "avatars_authenticated_manage_own" on "storage"."objects";

drop policy "avatars_public_read" on "storage"."objects";

drop policy "catches_authenticated_manage" on "storage"."objects";

drop policy "catches_public_read" on "storage"."objects";


