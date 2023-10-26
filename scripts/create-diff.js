import getLatestBuilds, { sort } from "./utils/get-latest-builds.js";
import * as diff from "diff";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const differencesFolder = "differences";
const { live: liveBuilds, ptu: ptuBuilds } = getLatestBuilds();
// , oldStem, newStem
function generateDiff(oldContent, newContent) {
	const differences = diff.diffLines(oldContent, newContent);

	const added = new Set();
	const removed = new Set();

	for (const difference of differences) {
		const targetSet = difference.added ? added : difference.removed ? removed : undefined;
		if (!targetSet) continue;
		for (const value of difference.value.split("\r\n").filter((v) => v !== ""))
			targetSet.add((difference.added ? "+" : difference.removed ? "-" : " ") + " " + value); // Added: "+" | Removed: "-" | Neither: " "
	}

	// const headerSection = `# Comparing ${oldStem} with ${newStem}\n\n`;
	const addedSection = "# Added\n" + [...added].join("\n");
	const removedSection = "# Removed\n" + [...removed].join("\n");

	// headerSection +
	return (addedSection + "\n\n" + removedSection).replace(/[^\x00-\x7F]+/gi, ""); // Remove non-ascii characters
}

const latestLive = liveBuilds.slice(0, 2);
const latestPtu = ptuBuilds.slice(0, 2);

// Reverse so it's from old-to-new
const livePair = latestLive.reverse();
const ptuPair = latestPtu.reverse();
const mixPair = [latestLive[0], latestPtu[0]].sort(sort).reverse();

existsSync(differencesFolder) || mkdirSync(differencesFolder);

if (livePair.length > 1) {
	const diff = generateDiff(
		readFileSync(`translations/${livePair[0].file}`, "utf-8"),
		livePair[0].stem,
		readFileSync(`translations/${livePair[1].file}`, "utf-8"),
		livePair[1].stem,
	);

	writeFileSync(
		path.join(differencesFolder, livePair.map((build) => build.stem).join(" ") + ".diff"),
		diff,
	);
}

if (ptuPair.length > 1) {
	const diff = generateDiff(
		readFileSync(`translations/${ptuPair[0].file}`, "utf-8"),
		ptuPair[0].stem,
		readFileSync(`translations/${ptuPair[1].file}`, "utf-8"),
		ptuPair[1].stem,
	);

	writeFileSync(
		path.join(differencesFolder, ptuPair.map((build) => build.stem).join(" ") + ".diff"),
		diff,
	);
}

if (mixPair.length > 1) {
	const diff = generateDiff(
		readFileSync(`translations/${mixPair[0].file}`, "utf-8"),
		mixPair[0].stem,
		readFileSync(`translations/${mixPair[1].file}`, "utf-8"),
		mixPair[1].stem,
	);
	
	console.log(
		`translations/${mixPair[0].file}`,
		mixPair[0].stem,
		`translations/${mixPair[1].file}`,
		mixPair[1].stem,
	);

	writeFileSync(
		path.join(differencesFolder, mixPair.map((build) => build.stem).join(" ") + ".diff"),
		diff,
	);
}
