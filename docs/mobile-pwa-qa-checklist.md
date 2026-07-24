# Mobile and PWA QA checklist

Run this checklist against the production preview or deployed HTTPS build. Use a fresh browser profile for installation and first-load checks, then repeat the persistence checks with existing data.

Record the device model, OS version, browser version, build commit, base path, and result for every run.

## iPhone Safari and installed PWA

- [ ] Open the HTTPS site in Safari and confirm the dashboard loads without horizontal scrolling.
- [ ] Add Repwise to the Home Screen, launch it from the icon, and confirm it opens in standalone mode with the correct name and icon.
- [ ] Check the safe areas in portrait orientation: headers, forms, modals, and bottom navigation must not overlap the notch, Dynamic Island, or home indicator.
- [ ] At 320 px and 390 px viewport widths, verify readable text, natural card stacking, reachable actions, and no clipped set inputs.
- [ ] Switch between light, dark, and system themes. Relaunch the installed app and confirm the selected theme persists.
- [ ] Start a workout, add an exercise and sets, edit weight/reps/warm-up values, complete a set, and finish the workout.
- [ ] Start a rest timer, background the app for longer than the displayed interval, then return. Confirm the timer shows the correct remaining time or zero instead of resuming a stale countdown.
- [ ] Start another rest timer, close the installed app, reopen it, and confirm the deadline is restored from the active workout.
- [ ] Open a completed workout. Confirm it is read-only until **Edit workout** is selected.
- [ ] In edit mode, change the name, date, notes, exercise order, warm-up state, weight, and repetitions; add and remove a set; cancel and confirm no values changed.
- [ ] Repeat the edit, save it, and confirm the workout summary, progress chart, personal records, and previous-session values reflect the saved data.
- [ ] Remove an exercise in edit mode and confirm the destructive prompt appears before its sets are removed.
- [ ] Export a JSON backup and confirm Safari creates a downloadable/shareable file.
- [ ] Import the backup and inspect add/update/conflict/invalid/skipped counts before choosing an action.
- [ ] Enable Airplane Mode after one successful online load, relaunch the installed app, and confirm the app shell and existing IndexedDB data remain available.
- [ ] While offline, create and finish a workout. Restore connectivity, relaunch, and confirm the workout remains present.
- [ ] Clear the site's Safari storage only after exporting a backup; confirm local data disappears, then restore it from the exported file.

## Android Chrome and installed PWA

- [ ] Open the HTTPS site in Chrome and confirm the install prompt or **Install app** menu item is available.
- [ ] Install Repwise, launch it from the app drawer/home screen, and confirm standalone display, icon, splash colours, and app name.
- [ ] Test portrait layouts at 320 px and 390 px widths, including the active-workout set grid, completed-workout editor, import preview, dialogs, and bottom navigation.
- [ ] Confirm controls remain tappable with the software keyboard open and numeric fields use an appropriate numeric keyboard.
- [ ] Switch light/dark/system themes and confirm the choice survives a full app close and relaunch.
- [ ] Start a workout and rest timer, switch to another app, lock the device, wait past the deadline, and return. Confirm the remaining time is recalculated from the stored deadline.
- [ ] Force-stop and reopen Repwise during an active rest timer. Confirm the active workout and deadline are restored.
- [ ] Complete and edit a workout, exercising cancel, save, reorder, add/remove set, warm-up, and remove-exercise confirmation paths.
- [ ] Confirm edited values flow through the workout summary, progress chart, personal records, and previous-session display.
- [ ] Export a JSON backup, import it, and verify the merge preview counts before merging.
- [ ] Test a known older record, newer record, and equal-timestamp conflict. Confirm the older record is skipped, the newer one is proposed as an update, and the conflict prevents merge.
- [ ] Enable Airplane Mode after one successful online load and confirm navigation, reads, and IndexedDB writes continue to work.
- [ ] Create data offline, close the app, reopen it offline, and confirm the data persists. Reconnect and confirm it remains unchanged.
- [ ] Use Chrome site settings to clear Repwise storage only after exporting; confirm the warning is accurate and the backup can restore the data.

## Cross-device release checks

- [ ] Verify the service worker controls the production build after the first reload and no failed precache requests appear in browser diagnostics.
- [ ] Publish a changed build and confirm the update banner appears; accept it and confirm the app reloads into the new version.
- [ ] Confirm hash-routed URLs work under both `/` and a repository subpath build.
- [ ] Confirm all PWA icons load, including the 192 px, 512 px, maskable, and Apple touch icons.
- [ ] Confirm no console errors, unhandled promise rejections, IndexedDB transaction failures, or accessibility-critical warnings occur during the checklist.

## Data-safety sign-off

- [ ] Replacement import clears and restores all tables in one transaction.
- [ ] Merge import preserves local-only records and writes additions/updates in one transaction.
- [ ] Invalid records, duplicate IDs, orphaned workout relationships, and equal-timestamp conflicts cause no database changes.
- [ ] Clearing browser/site storage is still correctly documented as destructive because Repwise has no server copy.
