Adapted from the MIT-licensed Cult of the Lamb Save Editor project.

Forked from: [https://github.com/fabiobarcelona/Cult-of-the-Lamb-Save-Editor](https://github.com/fabiobarcelona/Cult-of-the-Lamb-Save-Editor)

# Cult of the Lamb Save Editor
<p align="center">
  <img src="https://user-images.githubusercontent.com/43356571/196006052-12910a6d-cb81-4349-92a9-8d108b3db876.png" width="700px" height="350px" align="center">
</p>

An easy to use SPA to edit your Cult of the Lamb Save File. Upload your save file, either encrypted of decrypted and start editing it to your liking. Save it and place the new downloaded file in your saves folder.

## macOS `slot_0` support

This fork also supports the macOS app-container save format used by `com.devolverdigital.cultofthelamb`: a `ZB` prefix followed by a GZIP-compressed JSON save. Upload the extensionless `slot_0` file directly. The editor decompresses it in the browser, keeps the original save data format selected, and exports the edited JSON with the `ZB` prefix and GZIP compression restored.

The save folder for this app is `~/Library/Containers/com.devolverdigital.cultofthelamb/Data/Library/Application Support/com.devolverdigital.cultofthelamb/user/`. The browser downloads the edited file; close the game before replacing `slot_0`, and keep a backup.

## Run locally

Install the project dependencies with `pnpm install`, then start the editor with `pnpm dev --host 127.0.0.1`. Open the local address printed in the terminal. The editor starts by asking the user to select a save file; it never reads or replaces an installed save automatically.

After editing, choose **Baixar save editado**. The browser downloads the edited file using the original filename and format. Keep a backup, close the game, and replace the save manually. The editor accepts encrypted saves, `.mp` files, JSON saves, and macOS `slot_0` files in ZB + GZIP format.

## Features

- Cult General
  - Cult Name
  - Cult Traits
  - Dungeon Doors Unlocked
  - Cooking Recipes
  - Current Day

- Character
  - Red, Spirit, Diseased or Blue hearts
  - Unlock Fleeces (WIP)

- Inventory Editor
- Tarot Cards
- Doctrines (WIP)
- Followers
  - Edit almost everything (Name, Skin, Outfit, Status...)
  - Delete Followers
  - Revive Dead Followers

- Buildings Unlock (WIP)

And much more to come over time! :)

## Installed-game catalogs

Catalog IDs were refreshed from the installed macOS game **1.4.12**, using its Unity IL2CPP metadata, rather than assuming IDs from another release. The follower editor now exposes clothing as well as outfits. New entries use internal game names; unverified trait effects are marked as not cataloged. Existing descriptions are retained and may still need revision. Skin mappings are supplemented only by unambiguous combinations observed in the installed save. Unknown save values remain available and are preserved when unchanged.

After updating the installed game, run `python3 scripts/update-game-catalog.py` from this directory, then reload the editor. The script currently supports metadata schema 31 and stops on unsupported schemas; this is not a guarantee of compatibility with every future release. It reads the installed game and `slot_0`, writes only this project's catalogs, and never modifies the installed save. `fleeces.json` records the extracted fleece IDs for reference; it does not add a fleece editing interface.

### Text and artwork enrichment

Run `python3 scripts/enrich-game-catalog.py` in a Python environment with `UnityPy` installed after refreshing IDs. This reads PT-BR text and Sprite artwork from the installed game, keeps source asset names, and separates enum-only/internal entries from the ordinary menus. These extracted assets are for this local editor; the game's art remains owned by its creators. Do not assume permission to republish them.

Tarot fronts are now extracted from the installed game's `WeaponCard.atlas` and its texture. All 67 ordinary catalog entries have front artwork, including corrupted and co-op cards. Some internal enum entries have no published localized name/effect and remain under the advanced/restricted controls. Existing unknown values stay in the save.

Missing inventory icons are resolved through the native `Inventory Icon Mapping` where available, including devotion and the decoration unlock entry. The catalog now contains 147 item icons. `MEAL_SPICY` and the restricted `ExCultLeader` trait still use explicitly identified generic icons because their matching art has not been identified in this installed version. Internal enum values may also lack art.

### Local follower previews

Follower cards and **Skin Preview** use local transparent layers rendered from `Follower.skel` (Spine 3.8.99). The 128 native groups / 305 variant entries use the installed per-slot palettes selected by `SkinCharacter`, `SkinName` and `SkinColour`. **Outfit Preview** now composes the actual follower's full skeleton, colour, assigned clothing/variant and outfit overlay; **Follower Clothing Preview** shows the assigned clothing without that overlay. All resources are local and no longer depend on `cotl.xl0.org`. Native ClothingData supplies 38 clothing definitions and palettes; three additional legacy entries have native matching skeleton skins. Clothing colours and default variants come from the save's global `ClothingVariants` records (they are not `Follower.Customisation`). The variant selector edits the follower's `ClothingVariant` while preserving unknown values. The renderer loads the native binary once, then only the required texture parts; it does not pre-generate every possible follower/clothing combination. Unsupported legacy clothing, unknown colours or missing art are explicitly identified. This is a still idle pose; live animations/status logic and accessories are not simulated. All 21 outfit labels come from the installed enum, including the former Unknown IDs.

To regenerate, install `UnityPy`, `Pillow`, and `numpy` in a Python environment and `@pixi-spine/runtime-3.8@4.0.6` in a temporary Node environment. Run `scripts/extract-follower-assets.py` and `scripts/extract-follower-colors.py`, then `scripts/export-follower-geometry.cjs` with the Node environment's `node_modules` in `NODE_PATH`, then `scripts/render-follower-previews.py`, from this project. Intermediate originals/geometry go to `/private/tmp/cotl-*`; final PNGs and their mapping go to `public/Follower_Previews` and `public/data/followerPreviews.json`. The palette extraction also replaces the skin/variant ID table with the game's authoritative `WorshipperData` entries. The scripts never write to the installed game or save. New game updates must be re-extracted to include forms and palettes that did not exist in this installed version.

Avoid running a production build against the dev server's `.nuxt` directory while it is serving the editor. Stop the dev server before building, or restart it with a clean `.nuxt` afterward, so the page does not keep loading a stale production manifest.

Full appearance resources can be regenerated with `scripts/prepare-follower-renderer.py` after extracting follower assets. It reads the installed resources.assets ClothingData, verifies the binary records end exactly at the expected offset, and exports trimmed atlas parts plus the original Spine binary. The client uses `@pixi-spine/runtime-3.8` for native skin/mesh composition and draws it onto a transparent canvas.

The Clothing selector only offers the 41 entries with verified native appearance definitions. Unused legacy enum members Jumper/Singlet/Shirt/Robe and the Count sentinel are not offered as new selections; an existing legacy value remains visible and is preserved until changed. Unsupported clothing shows the follower portrait with an explanation rather than a blank image.

The top-right language selector offers Português (Brasil) and English, defaults to Brazilian Portuguese, and persists the preference in the `cotl-editor-language` cookie. UI labels, notifications, accessible labels, catalog names/descriptions, and supported JSON editor menus use the same reactive translator. Catalog translations use the installed game's English/Portuguese localization plus editor-specific translations. Localization only affects display; native save field names, IDs, follower names and appearance identifiers retain their original values. Searches include translated labels.
