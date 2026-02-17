const { createCanvas, loadImage, registerFont } = require('canvas');
registerFont('./Settings/Fonts/Cairo.ttf', { family: 'Cairo' });
registerFont('./Settings/Fonts/JF-Flat-Regular.ttf', { family: 'Flat' });
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "done",
  aliases: ["d"], 
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react('❌');
    const loogChannel = client.channels.cache.find(channel => channel.id === "1262151468086071396"); // ايدي الشات الي هيرسل فيه
    const mentionedUser = message.mentions.users.first();
    const textToPrint = args.slice(1).join(" "); 
    if (!mentionedUser) return message.reply("يرجى منشن شخص لعرض صورته على الصورة.");

    try {
      const background = await loadImage('./Settings/Services.png');
      const line = ('./Settings/line.png');
      const avatar = await loadImage(mentionedUser.displayAvatarURL({ format: 'png', dynamic: false, size: 512 }));
      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      ctx.font = "bold 40px Cairo"; 
      ctx.fillStyle = "white"; 
      ctx.textAlign = "center"; 

      ctx.fillText(mentionedUser.displayName, 925, 490);


      ctx.font = "bold 40px Cairo"; 
      ctx.fillStyle = "white"; 
      ctx.textAlign = "left";
      const spacedText = textToPrint.split('').join(' ');
      ctx.fillText(spacedText, 200, 250);



      ctx.beginPath();
      ctx.arc(765 + 330 / 2, 115 + 330 / 2, 330 / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatar, 765, 115, 330, 330);
      ctx.beginPath();
      ctx.arc(765 + 330 / 2, 115 + 330 / 2, 330 / 2, 0, Math.PI * 2, true);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; 
      ctx.lineWidth = 10; 
      ctx.stroke(); 


  

      const attachment = canvas.toBuffer();
      loogChannel.send({ files: [attachment] });
      await loogChannel.send({ files: [line] });
    } catch (error) {
      console.error("حدث خطأ أثناء تنفيذ الأمر:", error);
      message.reply("حدث خطأ أثناء تنفيذ الأمر. يرجى المحاولة مرة أخرى لاحقًا.");
    }
  }
};
