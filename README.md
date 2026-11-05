# Football Tagger

Tag football match video event by event (passes, crosses, shots, duels…) for both teams, then get a
Wyscout-style match report: team stats, passing networks, pass maps (completed vs incomplete), crosses,
shot maps with estimated xG, and player stats tables.

## Install on Windows

Every push builds a Windows installer with GitHub Actions:

1. Open the repo's **Actions** tab → **Build Windows app** → the latest successful run.
2. Download the **Football-Tagger-Windows** artifact and unzip it.
3. Run `Football-Tagger-Setup-x.y.z.exe` (installs with Start menu and desktop shortcuts), or run the
   `Football-Tagger-Portable-x.y.z.exe` without installing.

Windows SmartScreen may warn because the app isn't code-signed: click **More info → Run anyway**.

Pushing a tag such as `v1.0.0` also attaches the installers to a GitHub Release.

To build it yourself on Windows: `npm ci` then `npm run dist:win` (output in `release/`).

## Tagging workflow

1. **Teams**: set team names, colours, formations, shirt numbers and names (and add substitutes).
2. **Load match video**.
3. Click a player on the pitch, press an event key, then click on the pitch:
   - **Pass (P) / Cross (X)**: click the start point, then the end point, then click the receiver
     (or press **N** for incomplete, **Y** for completed without receiver). The receiver is auto-selected
     for the next action.
   - **Shot (S)**: pick result (G goal, O saved, W wide, B blocked, P post) and body part
     (R right, L left, H head, Y other), then click the shot location.
   - **Dribble (D), Tackle (T), Aerial (A)**: click location, then **Y** won / **N** lost.
   - **Interception (I), Clearance (C), Foul (F), Save (V)**: click location.
4. Subtags (Key pass, Assist, Penalty, Own goal, cards…) apply to the event in progress, or to the
   selected event in the log.

Keys: Space / Right Ctrl play-pause, ←/→ seek 5s (Shift = 1s), **Q** switch team, **H** switch half
(also swaps attacking direction), Ctrl+Z undo, Esc cancel, Delete removes the selected log entry.
Hotkeys are ignored while typing in a text box.

Coordinates are always stored from the tagging team's point of view (attacking left → right), so use the
flip button if the team you're tagging attacks the other way in the video.

## Saving, CSV and reports

- Work is autosaved in the app. **Save game** stores it under **Saved games** and opens the report.
- **Export CSV** downloads every event (with player names, start/end coordinates, receiver, outcome) and
  opens the report. CSVs can be re-imported from **Saved games → Import CSV** to regenerate a report.
- In the report, filter by half, filter pass maps by player, and use **Save PDF** to export it.

## Development

```
npm ci
npm run dev        # browser at http://localhost:5173
npm run desktop    # build and open in the desktop shell
npm run typecheck
```
