import mineflayer from "mineflayer";
import prismarine_block from "prismarine-block";
import minecraft_data from "minecraft-data";

import { pathfinder, Movements } from "mineflayer-pathfinder";
import mineflayer_pathfinder from "mineflayer-pathfinder";
const goals = mineflayer_pathfinder.goals;

import { findBlock, MAX_POS, MIN_POS } from "./area.js";

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

/**
 * @type {prismarine_block.Block}
 */
let BED = null;
/**
 * @type {prismarine_block.Block}
 */
let PRESSURE_PLATE = null;

// On spawn go to the bed and interact with it (respawn point) 
bot.once("spawn", async () => {
    await bot.waitForChunksToLoad();

    bot.pathfinder.setMovements(defaultMove);

    const bed = findBlock(MIN_POS, MAX_POS, bot, (block) => block.name.includes("_bed"));
    const pressure_plate = findBlock(MIN_POS, MAX_POS, bot, (block) => block.name.includes("oak_pressure_plate"));

    if(!bed) {
        console.log("I can't find a bed inside the work area, please add one.");

        bot.quit();
        process.exit();
    }

    console.log("Bed found at: " + bed.position);

    if(!pressure_plate) {
        console.log("I can't find a pressure plate the work area, please add one.");

        bot.quit();
        process.exit();
    }

    console.log("Pressure plate found at: " + pressure_plate.position);
    
    BED = bed;
    PRESSURE_PLATE = pressure_plate;

    await bot.pathfinder.goto(new goals.GoalNear(BED.position.x, BED.position.y, BED.position.z, 1));

    await bot.lookAt(BED.position);

    await bot.activateBlock(BED);
});

// bot.on("message", (msg) => console.log(msg));

setInterval(async () => {
    // Low food => Make the bot die to respawn with full food
    if(bot.food <= 1) {
        // Clear inventory in the copper chest

        await bot.pathfinder.goto(new goals.GoalBlock(PRESSURE_PLATE.position.x, PRESSURE_PLATE.position.y, PRESSURE_PLATE.position.z));
    }
}, 60 * 1000); // Every minute

bot.on("chat", async (username, message) => {
    if(message === "kill") {
        await bot.pathfinder.goto(new goals.GoalBlock(PRESSURE_PLATE.position.x, PRESSURE_PLATE.position.y, PRESSURE_PLATE.position.z));
    }
});
