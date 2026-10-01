import {sqliteTable,text,integer,index} from "drizzle-orm/sqlite-core";
export const runs=sqliteTable("runs",{
 id:text("id").primaryKey(),nickname:text("nickname").notNull(),seed:integer("seed").notNull(),started:integer("started").notNull(),finished:integer("finished"),score:integer("score"),duration:integer("duration")
},table=>[index("idx_runs_score").on(table.score)]);
