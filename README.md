# Cult of the Lamb Save Editor

An online save editor for **Cult of the Lamb**, adapted from the MIT-licensed [Cult of the Lamb Save Editor by fabiobarcelona](https://github.com/fabiobarcelona/Cult-of-the-Lamb-Save-Editor).

**Use the editor:** [gu-bra.github.io/CultOfTheLamb-SaveEditor](https://gu-bra.github.io/CultOfTheLamb-SaveEditor/)

The editor runs in your web browser. Select a save file to load it, make changes in the editor, then download the edited file and replace your original save manually. The site works with the save file you select in the browser and downloads the edited copy; it does not replace the original automatically.

## How to use

1. Make a backup of your save file.
2. Open the editor link above and choose your save file.
3. Use the navigation to edit your character, inventory, tarot cards, followers, upgrades, buildings and JSON data.
4. Choose **Download Edited Save** when you are done.
5. Close the game, then replace the original save with the downloaded file. Keep your backup until you have confirmed the game loads the edited save correctly.

The editor supports encrypted saves, `.mp` saves, JSON saves, and macOS `slot_0` saves in the `ZB` + GZIP format. The downloaded file keeps the original filename and save format.

## Save file locations

The upload screen shows copyable paths for Windows and macOS. On macOS, the Apple Arcade save is stored separately at:

```text
~/Library/Containers/com.devolverdigital.cultofthelamb/Data/Library/Application Support/com.devolverdigital.cultofthelamb/user/
```

For the **Apple Arcade version**, disable the internet before opening the game to load the edited save. You can turn the internet back on after the save has loaded.

## What you can edit

- **Character and cult:** save information and character values available in the editor.
- **Inventory:** item quantities, including items present in the save that do not have a catalog description.
- **Tarot cards:** collected cards.
- **Followers:** follower details and appearance, including skin, clothing and outfit previews; delete followers and revive dead followers.
- **Recruiting and dead followers:** edit and manage their entries.
- **Upgrades:** Divine Inspiration and Sermon upgrades, doctrines, and building unlocks.
- **JSON data:** inspect and edit the save data in the browser.

The interface is available in Brazilian Portuguese and English. A sample save can be loaded from the upload screen to explore the editor without selecting a personal save.

## Notes

- Always keep a backup of your original save.
- The editor changes the file you select in the browser and downloads the result. You replace the game save yourself after closing the game.
- The displayed catalog and artwork are based on game version **1.4.12**. Other game versions may use different data or contain values that the editor cannot identify.
- Unknown save values are retained when possible. Review the downloaded save in game before deleting your backup.

## Attribution

Forked from: [https://github.com/fabiobarcelona/Cult-of-the-Lamb-Save-Editor](https://github.com/fabiobarcelona/Cult-of-the-Lamb-Save-Editor)

Made by [Gu-BRA](https://github.com/Gu-BRA).
