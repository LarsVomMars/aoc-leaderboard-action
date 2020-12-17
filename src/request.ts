import * as https from "https";

export async function request(url: string, session: string): Promise<AOCAPI> {
    return new Promise((resolve, reject) => {
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Cookie: `session=${session}`
            }
        };
        const req = https.request(url, options, res => {
            res.setEncoding("utf8");
            let data = "";
            res.on("data", chunk => (data += chunk));
            res.on("end", () => {
                try {
                    if (res.statusCode !== 200)
                        return reject(new Error(res.statusMessage));
                    const jsonData = JSON.parse(data);
                    return resolve(jsonData);
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on("error", reject);
        req.end();
    });
}

export interface AOCAPI {
    event: string;
    owner_id: string;
    members: AOCMembers;
}

export interface AOCMembers {
    [uid: string]: AOCMember;
}

export interface AOCMember {
    local_score: number;
    global_score: number;
    last_star_ts: string;
    name: string;
    stars: number;
    id: string;
    completion_day_level: any; // I don't really care about this
}

export interface AOCUser {
    name: string;
    github: string;
    score: number;
    stars: number;
}
