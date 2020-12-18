import * as core from "@actions/core";
import { AOCUser, request } from "./request";
import { promises as fs } from "fs";

async function run(): Promise<void> {
    try {
        // Get action inputs
        const id = core.getInput("leaderboardID");
        const session = core.getInput("session");
        const inputYear = core.getInput("year");
        const fileName = core.getInput("filename") || "README.md";

        // Default year
        const date = new Date(Date.now());
        const year =
            inputYear || date.getMonth() < 11
                ? date.getFullYear() - 1
                : date.getFullYear();
        const leaderboardURL = `https://adventofcode.com/${year}/leaderboard/private/view/${id}.json`;
        const resp = await request(leaderboardURL, session);

        // Normalize into array
        const members: AOCUser[] = [];
        for (const memberID in resp.members) {
            const member = resp.members[memberID];
            members.push({
                name: member.name,
                score: member.local_score,
                stars: member.stars,
                github: `https://github.com/${member.name
                    .replace(/\s/g, "")
                    .toLowerCase()}`
            });
        }
        // Sort by score
        members.sort((a, b) => b.score - a.score);

        let file = await fs.readFile(fileName, "utf8");
        // eslint-disable-next-line no-console
        console.log(fileName, file);

        const tableRegex = new RegExp( // TODO: Think about \\s* pre-/suffixes
            `\\|(\\w+\\|){4}\\n\\|([:-]+\\|){4}\\n\\|\\*\\*Event\\*\\*\\|\\|\\|${year}\\|\\n\\|\\*\\*Leaderboard\\*\\*\\|\\|\\|${id}\\|(\\n\\|\\s*\\d+\\s*\\|\\[[\\w\\s]+\\]\\([\\w:\\/\\.]+\\)\\|(\\d+\\|){2})+\\n\\|(\\w+\\|){4}`,
            "gi"
        );

        if (tableRegex.test(file)) {
            // Update existing table
            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                const memberString = `|${i + 1}|[${member.name}](${
                    member.github
                })|${member.score}|${member.stars}|`;
                const regex = new RegExp(
                    `\\|\\s*${
                        i + 1
                    }\\s*\\|\\[[\\w\\s]+\\]\\([\\w:\\/\\.]+\\)\\|(\\d+\\|){2}`,
                    "gi"
                );
                file = file.replace(regex, memberString);
            }
            await fs.writeFile(fileName, file, "utf8");
        } else {
            // Create new table
            let tbl =
                "\n|Rank|Name|Score|Stars|\n|:----|:----|-----:|-----:|\n|**Event**|||2020|\n|**Leaderboard**|||659813|\n";
            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                const memberString = `|${i + 1}|[${member.name}](${
                    member.github
                })|${member.score}|${member.stars}|`;
                tbl += `${memberString}\n`;
            }
            tbl += "|Rank|Name|Score|Stars|";
            await fs.appendFile(fileName, tbl, "utf8");
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
