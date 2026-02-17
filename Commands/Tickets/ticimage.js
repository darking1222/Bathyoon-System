const { Client, Collection, MessageAttachment, WebhookClient, Intents, MessageButton, MessageEmbed, MessageSelectMenu, MessageActionRow, MessageModal, Role, Modal, TextInputComponent } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const db = require(`pro.db`);

module.exports = {
  name: "ticimage",
  description: "A simple ping command.",
  run: async (Client, Message) => {

    if (!owners.includes(Message.author.id)) return Message.react('❌');
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }
    if (Message.author.bot) return;
    if (!Message.guild) return;

    let attachmentUrl = '';
    if (Message.attachments.size > 0) {
      const attachment = Message.attachments.first();
      attachmentUrl = attachment.url;
    } else {
      const Url = Message.content.split(` `).slice(1).join(` `);
      if (!Url) return Message.reply({ content: `**يرجى ارفاق رابط الصورة.**` });
      attachmentUrl = Url;
    }

    Message.react("✅").then(() => {
      db.set(`Image = [${Message.guild.id}]`, attachmentUrl);
    });
  },
};
