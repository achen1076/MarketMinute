-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_active_watchlist_id_fkey" FOREIGN KEY ("active_watchlist_id") REFERENCES "watchlists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
