// + package.json
// - "update-icon-names": "node ./app/components/library/Icon/icon-name-generator.mjs"
// * pnpm run update-icon-names

import { readFileSync, writeFile } from "fs"
import { fileURLToPath } from "url"
import { dirname } from "path"

const iconsSpriteFile = readFileSync("public/icons/untitled-ui-sprite.svg", "utf-8")

const iconNames = []
const regexToExtractNames = /id="(.+?)"/g
let match
while ((match = regexToExtractNames.exec(iconsSpriteFile)) !== null) {
  iconNames.push(match[1])
}

const moduleURL = new URL(import.meta.url)
const filePath = fileURLToPath(moduleURL)
const directoryPath = dirname(filePath)

const fileName = directoryPath + "/names.ts"
const fileContent = `export const ICON_NAMES = [
  "",
  "${iconNames.join('",\n  "')}"
] as const`

writeFile(fileName, fileContent, (err) => {
  if (err) {
    console.error(err)
    return
  }
  console.log("Icon names saved to " + fileName)
})
