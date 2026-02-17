const d5b = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { Permissions } = require("discord.js");

module.exports = {
    name: "imagechat",
    description: "To set Url room",
    usage: "!set-Url <Url>",
    run: async (client, message) => {


   if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = d5b.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

        let Url = "";
        if (message.content.includes("http")) {
            Url = message.content.split(" ")[1];
        } else if (message.attachments.size > 0) {
            Url = message.attachments.first().url;
        } else {
            return message.reply({ content: "**يرجى ارفاق رابط الصورة.**" });
        }

        d5b.set(`Url = [ Colors ]`, Url);
        message.react("✅");
    }
};
