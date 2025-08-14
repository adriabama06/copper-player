import mineflayer from "mineflayer";
import prismarine_block from "prismarine-block";
import minecraft_data from "minecraft-data";

import { pathfinder, Movements } from "mineflayer-pathfinder";
import mineflayer_pathfinder from "mineflayer-pathfinder";
const goals = mineflayer_pathfinder.goals;

import sleep from "./sleep.js";;

import { findBlock, MAX_POS, MIN_POS } from "./area.js";
import { findChests, openStoreChest, openUsefulDropChest } from "./chests.js";

const bot = mineflayer.createBot({
    host: process.env.SERVER_IP,
    port: process.env.SERVER_PORT,
    version: process.env.VERSION,
    auth: process.env.AUTH,
    username: process.env.USERNAME,
    password: process.env.PASSWORD
});

bot.loadPlugin(pathfinder);

const defaultMove = new Movements(bot);

defaultMove.canDig = false; // Disable break blocks
// defaultMove.blocksCantBreak = new Set(
//     minecraft_data(process.env.VERSION).blocksArray.map((block) => block.id)
// ); // Disable break blocks
defaultMove.scafoldingBlocks = []; // Disable place blocks

// On spawn go to the bed and interact with it (respawn point) 
bot.once("spawn", async () => {
    await bot.waitForChunksToLoad();

    bot.pathfinder.setMovements(defaultMove);

    const BED = findBlock(bot, MIN_POS, MAX_POS, (block) => block.name.includes("_bed"));
    const PRESSURE_PLATE = findBlock(bot, MIN_POS, MAX_POS, (block) => block.name.includes("oak_pressure_plate"));

    if (!BED) {
        console.log("I can't find a bed inside the work area, please add one.");

        bot.quit();
        process.exit();
    }

    console.log("Bed found at: " + BED.position);

    if (!PRESSURE_PLATE) {
        console.log("I can't find a pressure plate the work area, please add one.");

        bot.quit();
        process.exit();
    }

    console.log("Pressure plate found at: " + PRESSURE_PLATE.position);

    await bot.pathfinder.goto(new goals.GoalNear(BED.position.x, BED.position.y, BED.position.z, 1));

    await bot.lookAt(BED.position);

    await bot.activateBlock(BED);

    bot.on("chat", async (username, message) => {
        if (message === "kill") {
            await bot.pathfinder.goto(new goals.GoalBlock(PRESSURE_PLATE.position.x, PRESSURE_PLATE.position.y, PRESSURE_PLATE.position.z));
        }
    });

    /**
     * @type {string[]}
     */
    var skip_items = [];

    while (true) {
        const [DROP_CHESTS, STORE_CHESTS] = findChests(bot, MIN_POS, MAX_POS);

        // Option 1: Give food... Option 2: Kill the bot and let them respawn.
        if (bot.food <= 1) {
            await bot.pathfinder.goto(new goals.GoalBlock(PRESSURE_PLATE.position.x, PRESSURE_PLATE.position.y, PRESSURE_PLATE.position.z));

            // Wait till respawn
            await new Promise((resolve) => {
                bot.once("respawn", () => resolve());
            });
            
            await sleep(5000);
        }

        const source = await openUsefulDropChest(bot, DROP_CHESTS, (item) => !skip_items.includes(item.name) && store_chests.has(item.name));

        if (!source) {
            console.log("No items found to work, sleeping");

            await sleep(5000);

            continue;
        }

        // Obtain items until the inventory gets full or in the chest are no more items left
        // The bot.inventory is not updated till container.close() is executed, so use i to count the added items
        for (let i = 0; i < source.target_items.length && (bot.inventory.items().length + i) < (4 * 9); i++) {
            const slot = source.target_items[i];

            await source.container.withdraw(slot.type, null, slot.count);

            await sleep(100);
        }

        source.container.close();

        while (true && bot.inventory.items().length > 0) {
            const target = await openStoreChest(bot, STORE_CHESTS.get(source.target_items[0].name));

            // Everything is full
            if (!target) {
                skip_items.push(source.target_items[0].name);

                await bot.pathfinder.goto(new goals.GoalNear(source.chest_used.position.x, source.chest_used.position.y, source.chest_used.position.z, 4));
                await bot.lookAt(source.chest_used.position);

                const container = await bot.openContainer(source.chest_used);

                for (let i = 0; i < source.target_items.length && (bot.inventory.items().length - i) > 0; i++) {
                    const slot = source.target_items[i];

                    await source.container.deposit(slot.type, null, slot.count);

                    await sleep(100);
                }

                container.close();

                break;
            }

            for (let i = 0; i < source.target_items.length && (bot.inventory.items().length - i) > 0 && target.container.containerItems().length < eval(target.container.type.split("_")[1].replace("x", "*")); i++) {
                const slot = source.target_items[i];

                await target.container.deposit(slot.type, null, slot.count);

                await sleep(100);
            }

            target.container.close();
        }

        console.log("Finish", source.target_items[0].name);
    }
});
