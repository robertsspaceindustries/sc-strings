import fs from "node:fs";

function removeFileExtension(path) {
	return path
		.split(".")
		.slice(0, -1) // Remove file extension element
		.join(".");
}

function convertFilename(file, branch) {
	const [game, versionName, version, id] = removeFileExtension(file).split("-");

	return {
		game,
		versionName,
		version,
		id,
		branch,

		file: branch + "/" + file,
		stem: removeFileExtension(file) + "-" + branch,
	};
}

export function sort(a, b) {
	// Sort by version in descending order
	const versionA = a.version.split(".").map(Number),
		versionB = b.version.split(".").map(Number);

	for (let i = 0; i < 3; i++) {
		if (versionA[i] > versionB[i]) {
			return -1; // Sort in descending order for version
		}
		if (versionA[i] < versionB[i]) {
			return 1; // Sort in descending order for version
		}
	}

	// If versions are equal, sort by id in descending order
	if (a.id > b.id) {
		return -1; // Sort in descending order for id
	} else if (a.id < b.id) {
		return 1; // Sort in descending order for id
	}

	return 0;
}

export default function getLatestBuilds() {
	const translationsLive = fs
			.readdirSync("translations/live")
			.map((name) => convertFilename(name, "live"))
			.sort(sort),
		translationsPtu = fs
			.readdirSync("translations/ptu")
			.map((name) => convertFilename(name, "ptu"))
			.sort(sort);

	return { live: translationsLive, ptu: translationsPtu };
}
