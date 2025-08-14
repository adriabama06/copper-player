import mineflayer from "mineflayer";
import prismarine_block from "prismarine-block";
import { Vec3 } from "vec3";

/**
 * @returns {Vec3}
 * @param {string} text 
 */
export function parseCoord(text) {
    return new Vec3(
        parseFloat(text.split(",")[0]),
        parseFloat(text.split(",")[1]),
        parseFloat(text.split(",")[2])
    );
}

/**
 * @returns {boolean}
 * @param {Vec3} min 
 * @param {Vec3} max 
 * @param {Vec3} pos 
 */
export function isInside(min, max, pos) {
    if (pos.x >= min.x && pos.y >= min.y && pos.z >= min.z) {
        if (pos.x <= max.x && pos.y <= max.y && pos.z <= max.z) {
            return true;
        }
    }

    return false;
}

/**
 * @returns {prismarine_block.Block | null}
 * @param {Vec3} min 
 * @param {Vec3} max 
 * @param {mineflayer.Bot} bot
 * @param {(block: prismarine_block.Block) => boolean} fn
 */
export function findBlock(min, max, bot, fn) {
    for (let x = min.x; x <= max.x; x++) {
        for (let y = min.y; y <= max.y; y++) {
            for (let z = min.z; z <= max.z; z++) {
                const block = bot.blockAt(new Vec3(x, y, z));

                if(!block) continue;

                if(fn(block)) return block;
            }
        }
    }

    return null;
}

const pos1 = parseCoord(process.env.WORK_AREA.split("|")[0]);
const pos2 = parseCoord(process.env.WORK_AREA.split("|")[1]);

export const MIN_POS = {
    x: Math.min(pos1.x, pos2.x),
    y: Math.min(pos1.y, pos2.y),
    z: Math.min(pos1.z, pos2.z)
}

export const MAX_POS = {
    x: Math.max(pos1.x, pos2.x),
    y: Math.max(pos1.y, pos2.y),
    z: Math.max(pos1.z, pos2.z)
}
