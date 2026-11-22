# Query Timings

We ran `dbms/benchmark.sql` 5 times, each on a fresh database, and took the middle time.

- PostgreSQL 18.4 on an Apple M4
- 50,000 hackathons, about 150,000 tag rows and 2,000 skills, all generated for the test
- Times will be different on another laptop

## Results

| Query | Without indexes | With indexes | Result |
| :--- | ---: | ---: | :--- |
| Q1 Recommendations | 7.837 ms | 0.761 ms | about 10 times faster |
| Q6 Trending skills | 22.767 ms | 22.525 ms | about the same |
| Q8 Upcoming events | 11.632 ms | 8.715 ms | about 1.3 times faster |

## What the plans show

**Q1:** Without an index, Postgres reads all the rows in `hackathon_skills`. With
`idx_hackathon_skills_skill_id` it stops after about 1,100 rows.

**Q6:** It has to count every tag, so it reads the whole table either way. An index does not help.

**Q8:** `idx_hackathons_start_date` makes the date search much faster (about 2.9 ms to 0.05 ms).
The full query improves less, because it still reads the tag table to show each event's tags.

With only the 20 demo hackathons every query is fast, and Postgres normally ignores these indexes
because reading a tiny table is cheaper.

The full plans are in `dbms/plans/`.

## Run it again

```bash
createdb hackmatch_bench
psql hackmatch_bench -f dbms/03_schema.sql
psql hackmatch_bench -f dbms/benchmark.sql
```
