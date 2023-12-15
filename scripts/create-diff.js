import getLatestBuilds from "./utils/get-latest-builds.js";
import * as diff from "diff";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

existsSync("differences") || mkdirSync("differences");

function generateDiff(oldContent, oldName, newContent, newName) {
    const differences = diff.diffLines(oldContent, newContent);

    const added = new Set(),
        removed = new Set();

    for (const difference of differences) {
        const targetSet = difference.added
            ? added
            : difference.removed
            ? removed
            : undefined;
        if (!targetSet) continue;
        for (const value of difference.value
            .split("\r\n")
            .filter((v) => v !== ""))
            targetSet.add(
                (difference.added ? "+" : difference.removed ? "-" : " ") +
                    " " +
                    value
            ); // Added: "+" | Removed: "-" | Neither: " "
    }

    if (added.size === 0 && removed.size === 0) return false;

    const headerSection = `--- ${oldName}\n` + `+++ ${newName}\n\n`,
        addedSection = "# Added\n" + [...added].join("\n"),
        removedSection = "# Removed\n" + [...removed].join("\n");

    return (headerSection || "") + addedSection + "\n\n" + removedSection;
}

const channels = await getLatestBuilds(); // The builds in each channel are antecedent

const baseChannelName = Object.keys(channels).find(
        (channelName) => channels[channelName].base
    ),
    channelsToCompare = [
        ...Object.keys(channels).map((channel) => [baseChannelName, channel]),
        ...Object.keys(channels)
            .filter((channel) => channel !== baseChannelName)
            .map((channel) => [channel, channel]),
    ];

console.log("Comparing channels:", channelsToCompare);

for (const [channel1Name, channel2Name] of channelsToCompare) {
    const shouldReverse = channel1Name === channel2Name;

    let channel1 = channels[channel1Name],
        channel2 = channels[channel2Name];

    if (shouldReverse)
        (channel1 = channel1.reverse()), (channel2 = channel2.reverse());

    const channel1Path = "translations/" + channel1Name,
        channel2Path = "translations/" + channel2Name;

    const latest1 = channel1[channel1Name === channel2Name ? 1 : 0], // Old
        latest2 = channel2[0]; // New
    if (!(latest1 && latest2)) continue;

    if (Number(latest1.change) > Number(latest2.change)) continue;

    console.log(channel1Name, "v.", channel2Name, latest1.name, "old");
    console.log(channel1Name, "v.", channel2Name, latest2.name, "new");

    const removeDuplicates = [...new Set([latest1, latest2])];
    if (removeDuplicates.length < 2) continue;

    const diff = generateDiff(
        readFileSync(channel1Path + "/" + latest1.filename, "utf-8"),
        latest1.name,
        readFileSync(channel2Path + "/" + latest2.filename, "utf-8"),
        latest2.name
    );

    if (diff) {
        console.log("Made diff for", latest1.name, latest2.name);

        writeFileSync(
            "differences/" + latest1.stem + " " + latest2.stem + ".diff",
            diff
        );
    }
}
