import fs from "node:fs";

export function removeFileExtension(path) {
	return path
		.split(".")
		.slice(0, -1) // Remove file extension element
		.join(".");
}

export default function getLatestBuilds() {
	const translations = fs.readdirSync("translations").map((translation) => {
		const [game, branch, version, id] = removeFileExtension(translation).split("-");
		return {
			game,
			branch,
			version,
			id,

			file: translation,
			stem: removeFileExtension(translation),
		};
	});

	const sorted = translations.sort((a, b) => {
		// Sort by version in descending order
		const versionA = a.version.split(".").map(Number);
		const versionB = b.version.split(".").map(Number);

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
	});

	return sorted;
}
