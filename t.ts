"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeInStorage = exports.makeOneImage = exports.followup_message = void 0;
const Sharp = require("sharp");
const config_1 = require("../utils/config");
const res_1 = require("../utils/res");
const typings_1 = require("../typings");
async function followup_message(token, payload) {
    try {
        var { body, files } = payload;
        if (!files)
            files = [];
        return await res_1.res.post(typings_1.Routes.webhook(config_1.DiscordAppId, token), {
            body,
            files,
            auth: false,
        });
    }
    catch (e) { }
}
exports.followup_message = followup_message;
async function makeOneImage(images) {
    const makeOverlay = async () => {
        var res = [];
        for (let i = 0; i < images.length; i++) {
            res.push({
                input: await Sharp(images[i].data).resize({
                    width: 256,
                    height: 256,
                    fit: "contain"
                }).toBuffer(),
                top: coordinates[i][1],
                left: coordinates[i][0],
                gravity: "northwest",
            });
        }
        return res;
    };
    const coordinates = [
        [0, 0], [256, 0],
        [0, 256], [256, 256]
    ];
    const canvas = Sharp({
        create: {
            width: 512,
            height: 512,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0.0 }
        }
    }).png();
    return await canvas.composite(await makeOverlay()).toBuffer();
}
exports.makeOneImage = makeOneImage;
async function storeInStorage(generated, upscaled = false, data) {
    if (!upscaled)
        return await res_1.res.post(typings_1.Routes.channelMessages(config_1.DiscordChannelStorage), {
            files: generated
        });
    else {
        let thread = data?.thread;
        if (!thread) {
            var getParentMessage = await res_1.res.get(typings_1.Routes.channelMessage(config_1.DiscordChannelStorage, data.id));
            console.log(getParentMessage);
            if (!getParentMessage?.thread)
                thread = await res_1.res.post(typings_1.Routes.threads(config_1.DiscordChannelStorage, data.id), {
                    body: {
                        name: "upscaled"
                    }
                });
        }
        return await res_1.res.post(typings_1.Routes.channelMessages(thread?.id), {
            files: generated
        });
    }
}
exports.storeInStorage = storeInStorage;