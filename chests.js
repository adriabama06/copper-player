import mineflayer from "mineflayer";
import prismarine_block from "prismarine-block";
import prismarine_entity from "prismarine-entity";
import prismarine_item from "prismarine-item";
import minecraft_data from "minecraft-data";
import { Vec3 } from "vec3";

import { pathfinder, Movements } from "mineflayer-pathfinder";
import mineflayer_pathfinder from "mineflayer-pathfinder";
const goals = mineflayer_pathfinder.goals;

import sleep from "./sleep.js";

import { findBlocks, isInside } from "./area.js";

/**
 * @returns {prismarine_block.Block}
 * @param {prismarine_entity.Entity} itemframe 
 * @param {prismarine_block.Block[]} chests 
 */
function findNearestChest(itemframe, chests) {
    let position = new Vec3(itemframe.position.x - 0.1, itemframe.position.y - 0.1, itemframe.position.z - 0.1).round();

    const delta_x = position.x - itemframe.position.x;
    const delta_y = position.y - itemframe.position.y;

    // If the diference in X is less than Y it means that the itemframe is touching the chest in the cord X, otherwise is Y
    if(Math.abs(delta_x) < Math.abs(delta_y)) {
        // Check if the increment is negative or positive to determinate if the position must be in the negative or positive
        position.x += delta_x > 0 ? 1 : -1;
    }
    else {
        position.y += delta_y > 0 ? 1 : -1;
    }

    // If is the chest in the estimated positon perfect, if not, search
    if(chests.find(c => c.position.x === position.x && c.position.y === position.y && c.position.z === position.z)) {
        return chests.find(c => c.position.x === position.x && c.position.y === position.y && c.position.z === position.z);
    }

    position = new Vec3(itemframe.position.x - 0.1, itemframe.position.y - 0.1, itemframe.position.z - 0.1).round();
    
    let best_chest = chests[0];
    let best_distance = itemframe.position.distanceTo(best_chest.position);

    for (let i = 1; i < chests.length; i++) {
        const chest = chests[i];
        const distance = itemframe.position.distanceTo(chest.position);

        if(distance > best_distance) continue;

        best_chest = chest;
        best_distance = distance;
    }

    return best_chest;
}

/**
 * @returns {{ entity: prismarine_entity.Entity, metadata: object }[]}
 * @param {mineflayer.Bot} bot
 * @param {Vec3} min 
 * @param {Vec3} max 
 */
function findItemFrames(bot, min, max) {
    const entities = bot.entities;

    const itemframes = [];

    for(const entity_id in entities) {
        const entity = entities[entity_id];

        if(!isInside(min, max, entity.position) || !entity.name || entity.name !== "item_frame") continue;

        if(entity.metadata.length === 0) continue;

        const metadata = entity.metadata.find((data) => data && data.itemId);

        if(!metadata) continue;

        itemframes.push({ entity, metadata });
    }

    return itemframes;
}

/**
 * @returns {[prismarine_block.Block[], Map<string, prismarine_block.Block[]>]}
 * @param {mineflayer.Bot} bot
 * @param {Vec3} min 
 * @param {Vec3} max 
 */
export function findChests(bot, min, max) {
    const drop_chests = findBlocks(bot, min, max,
        (block) => block.name === "trapped_chest" && block._properties && typeof block._properties.type === "string"
                   && (block._properties.type === "single" || block._properties.type === "right")
    );

    const chests = findBlocks(bot, min, max, (block) => block.name === "chest");

    if(drop_chests.length === 0 || chests.length === 0) {
        console.log("There are no chests");
        process.exit(0);
    }

    const itemframes = findItemFrames(bot, min, max);

    /**
     * @type {Map<string, prismarine_block.Block[]>}
     */
    const store_chests = new Map();

    for(const itemframe of itemframes) {
        const itemName = minecraft_data(process.env.VERSION).items[itemframe.metadata.itemId].name;

        if(store_chests.has(itemName)) {
            const chests = store_chests.get(itemName);

            store_chests.set([...chests, findNearestChest(itemframe.entity, chests)]);
            continue;
        }

        store_chests.set(itemName, [findNearestChest(itemframe.entity, chests)]);
    }

    return [ drop_chests, store_chests ];
}

/**
 * @param {mineflayer.Bot} bot
 * @param {prismarine_block.Block[]} drop_chests
 */
export async function openDropChest(bot, drop_chests) {
    for(const drop_chest of drop_chests) {
        await bot.pathfinder.goto(new goals.GoalNear(drop_chest.position.x, drop_chest.position.y, drop_chest.position.z, 4));
        await bot.lookAt(drop_chest.position);

        const container = await bot.openContainer(drop_chest);

        sleep(100);
        
        if(container.containerItems().length === 0) {
            container.close();
            continue;
        }

        return { chest_used: drop_chest, container };
    }

    // No chest aviable for the wanted objects
    return null;
}

/**
 * @param {mineflayer.Bot} bot
 * @param {prismarine_block.Block[]} drop_chests
 * @param {(item: prismarine_item.Item) => boolean} fn
 */
export async function openUsefulDropChest(bot, drop_chests, fn) {
    for(const drop_chest of drop_chests) {
        await bot.pathfinder.goto(new goals.GoalNear(drop_chest.position.x, drop_chest.position.y, drop_chest.position.z, 4));
        await bot.lookAt(drop_chest.position);

        const container = await bot.openContainer(drop_chest);

        await sleep(500);

        if(container.containerItems().length === 0) {
            container.close();
            continue;
        }

        const target_item = container.containerItems().find(fn);

        if(!target_item) {
            container.close();
            continue;
        }

        const target_items = container.containerItems().filter(fn).filter((item) => item.type === target_item.type)

        return { chest_used: drop_chest, container, target_items };
    }

    // No chest aviable for the wanted objects
    return null;
}

/**
 * @param {mineflayer.Bot} bot
 * @param {prismarine_block.Block[]} chests
 */
export async function openStoreChest(bot, chests) {
    for(const chest of chests) {
        await bot.pathfinder.goto(new goals.GoalNear(chest.position.x, chest.position.y, chest.position.z, 4));
        await bot.lookAt(chest.position);

        const container = await bot.openContainer(chest);

        await sleep(500);

        // The chest is full
        // NOTE: target.container.type is "minecraft:generic_NxN" --> container.type.split("_")[1] --> NxN --> Max chest size
        if(container.containerItems().length >= eval(container.type.split("_")[1].replace("x","*"))) {
            console.log("Container full", container.containerItems().length, eval(container.type.split("_")[1].replace("x","*")));
            container.close();
            continue;
        }

        return { chest_used: chest, container };
    }

    // No chest aviable for the wanted objects
    return null;
}
