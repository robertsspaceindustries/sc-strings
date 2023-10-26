import path from "node:path";
import getLatestBuilds from "./utils/get-latest-builds.js";
import * as diff from "diff";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const differencesFolder = path.resolve("differences");

const lastBuilds = getLatestBuilds().slice(0, 2).reverse(); // Old to new
if (lastBuilds.length !== 2) console.error("Need 2 builds to compare"), process.exit(0);

const [oldFile, newFile] = lastBuilds.map((build) =>
	path.join(path.resolve("translations"), build.file),
);
const differences = diff.diffLines(readFileSync(oldFile, "utf-8"), readFileSync(newFile, "utf-8"));

const added = new Set();
const removed = new Set();

for (const difference of differences) {
	const targetSet = difference.added ? added : difference.removed ? removed : undefined;
	if (!targetSet) continue;
	for (const value of difference.value.split("\r\n").filter((v) => v !== ""))
		targetSet.add((difference.added ? "+" : difference.removed ? "-" : " ") + " " + value); // Added: "+" | Removed: "-" | Neither: " "
}

const headerSection =
	"# " + `Comparing ${lastBuilds[0].stem} [old] with ${lastBuilds[1].stem} [new]\n\n`;
const addedSection = "# Added\n" + [...added].join("\n");
const removedSection = "# Removed\n" + [...removed].join("\n");

existsSync(differencesFolder) || mkdirSync(differencesFolder);

writeFileSync(
	path.join(differencesFolder, lastBuilds.map((build) => build.stem).join(" ") + ".diff"),
	(headerSection + addedSection + "\n\n" + removedSection).replace(/[^\x00-\x7F]+/gi, ""), // Remove non-ascii characters
);
