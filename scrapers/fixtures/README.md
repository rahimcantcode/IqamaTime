# Prayer parser fixtures

These are archived public-source excerpts for regression tests, not live prayer schedules.
Do not seed current prayer rows from these files.

- `icr-cmz.html`: Rowlett's official CMZ embed, captured during the October 2026 source repair.
- `mas-annual.txt`: MAS Dallas's official 2026 annual schedule, captured during that repair.
- `athanplus-dated.html`: IANT's official embedded [AthanPlus widget](https://timing.athanplus.com/masjid/widgets/embed?theme=1&masjid_id=xdy03lAX), captured October 29, 2026 around 23:04 UTC. The provider's first date is October 30 although the Dallas date is still October 29. Tests require exact date matching and must not relabel it.
- `allen-table.html`: [Islamic Association of Allen](https://allenmasjid.com), captured October 29, 2026. Daily columns are Adhan and Iqama. Maghrib explicitly says SUNSET / After 5 mins.
- `qalam-periods.html`: [Qalam Campus](https://qalamcampus.org), captured October 29, 2026. Calendar periods start October 15 and November 1; the source gives a relative Maghrib rule and separate khutbah/salah starts.

Scripts, styles and unrelated page sections are omitted from the latter three excerpts.
