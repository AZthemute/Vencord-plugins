/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { UserStore } from "@webpack/common";

const LeaveGroup = findByPropsLazy("closePrivateChannel");

const settings = definePluginSettings({
    silentlyLeave: {
        type: OptionType.BOOLEAN,
        description: "Whether or not to leave group chats silently",
        default: true,
        restartNeeded: false
    },
    userWhitelist: {
        type: OptionType.STRING,
        description: "Stay in GCs with these users: (Comma-separated IDs)",
        default: "",
        restartNeeded: false
    },
    invertWhitelistFunctionality: {
        type: OptionType.BOOLEAN,
        description: "Make the whitelist act like a blacklist",
        default: false,
        restartNeeded: false
    }
});

export default definePlugin({
    name: "NoMoreGroupchats",
    description: "Prevents people from adding you to group chats",
    authors: [
        {
            id: 505390548232699906n,
            name: "AZ#7011",
        },
    ],
    patches: [],
    settings,

    flux: {
        CHANNEL_CREATE(event) {
            onChannelCreate(event.channel);
        }
    },
});

export function onChannelCreate(channel) {
    // exit if it's not a group chat
    if (channel.type !== 3) return;

    // do not leave if you created the group chat: logically, you will always be the owner of a group chat you create, and never else
    if (channel.ownerId == UserStore.getCurrentUser().id) return;

    // user whitelist/blacklist:
    const whitelist = settings.store.userWhitelist.split(',');
    const usersInWhitelist = whitelist.filter(user => channel.recipients.includes(user));

    if (settings.store.invertWhitelistFunctionality == true) { // if blacklist
        if (usersInWhitelist.length == 0) return;
    }
    else if (usersInWhitelist.length > 0) return; // if whitelist

    LeaveGroup.closePrivateChannel(channel.id, false, settings.store.silentlyLeave);
    // LeaveGroup.closePrivateChannel(id, something idk (is null?), silent?);
}
