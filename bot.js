require("dotenv").config({
  path: "./.env",
});
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const tmp = require("tmp");

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const bot = new Telegraf(process.env.BOT_TOKEN);

let file, fileName, tmpFile, fileUrl;

bot.command("start", async (ctx) => {
  await ctx.reply(
    "<b>ＨＥＬＬＯ  ＷＥＬＣＯＭＥ  ＴＯ  ＡＮＯＮＹＭＯＵＳ\nＦＩＬＥ  ＵＰＬＯＡＤＥＲ  ＢＯＴ</b>\n\n◌ <b>Bot Version ⇨ </b><i>1.0</i>\n◌ <b>Bot Developer ⇨ </b><i><a href='https://t.me/bipuldey19'>Bipul Dey</a></i>\n◌ <b>Bot Channel ⇨ </b><i><a href='https://t.me/mirrorxbots'>MirrorX Bots</a></i>\n\n<b>ＣＯＭＭＡＮＤＳ</b>\n\n◌ <b>/start ⇨ </b>Check if I am alive!\n◌ <b>/info ⇨ </b>Get more information about this bot.",
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "<b>ＨＥＬＰ</b>\n\n◌ <b>Send me any file (Document) and I will upload it to the selected site.</b>\n◌ <b>Click on the button below to select the site.</b>\n\n<i>⚠️ File should be uploaded as document. Not photo, audio!</i>",
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }
  );
});

bot.command("info", async (ctx) => {
  await ctx.reply(
    `<b>ＩＮＦＯ</b>\n\n◌ <b><a href="https://pixeldrain.com/">Pixeldrain :</a></b>\n⇨ Limit: <i>20GB</i>\n⇨ Expires: <i>60 days of inactivity</i>\n◌ <b><a href="https://gofile.io/">Gofile :</a></b>\n⇨ Limit: <i>None</i>\n⇨ Expires: <i>10 days of inactivity</i>\n◌ <b><a href="https://nekofile.eu.org/">NekoFile</a></b>\n⇨ Limit: <i>10GB</i>\n⇨ Expires: <i>None</i>\n◌ <b><a href="https://file.io/">File.io</a></b>\n⇨ Limit: <i>2GB</i>\n⇨ Expires: <i>30 days of inactivity</i>\n◌ <b><a href="https://dropfile.repl.co//">DropFile</a></b>\n⇨ Limit: <i>10GB</i>\n⇨ Expires: <i>None</i>\n◌ <b><a href="https://anonymfile.com/">AnonymFile</a></b>\n⇨ Limit: <i>None</i>\n⇨ Expires: <i>None</i>\n◌ <b><a href="https://transfer.sh/">Transfersh</a></b>\n⇨ Limit: <i>10GB</i>\n⇨ Expires: <i>None</i>\n◌ <b><a href="https://filerio.in/">FileRio</a></b>\n⇨ Limit: <i>None</i>\n⇨ Expires: <i>None</i>\n\n<b>ＣＯＮＴＡＣＴ</b>\n\n◌ <b>Bot Version ⇨ </b><i>1.0</i>\n◌ <b>Bot Developer ⇨ </b><a href='https://t.me/bipuldey19'>Bipul Dey</a>\n◌ <b>Bot Channel ⇨ </b><a href='https://t.me/mirrorxbots'>MirrorX Bots</a>`,
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }
  );
});

bot.on("document", async (ctx) => {
  await ctx.reply("<b>⚠️ Select where to upload your file</b>", {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(
      [
        Markup.button.callback("Pixeldrain", "pixeldrain"),
        Markup.button.callback("Gofile", "gofile"),
        Markup.button.callback("NekoFile", "nekofile"),
        Markup.button.callback("File.io", "fileio"),
        Markup.button.callback("DropFile", "dropfile"),
        Markup.button.callback("Anonymfile", "anonymfile"),
        Markup.button.callback("Transfer.sh", "transfersh"),
        Markup.button.callback("FileRio", "filerio"),
      ],
      { columns: 2 }
    ),
  });

  file = ctx.update.message.document;
  fileName = file.file_name;
  fileType = file.mime_type;
  rawfileSize = file.file_size;
  //Function to format bytes to KB, MB, GB, TB, PB, EB, ZB, YB
  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
  fileSize = formatBytes(rawfileSize);

  tmpFile = tmp.fileSync({
    postfix: `.${file.file_name}`,
  }).name;

  console.log(`Temp file created: ${tmpFile}`);

  ctx.telegram.getFileLink(file.file_id).then((url) => {
    fileUrl = url;
  });
});

// Code when user clicks on "Pixeldrain" button
bot.action("pixeldrain", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ *Uploading file to Pixeldrain...*`, {
    parse_mode: "Markdown",
  });

  await axios({
    url: fileUrl.toString(),
    method: "GET",
    responseType: "stream",
  }).then(async (response) => {
    console.log(`File retrieved successfully`);

    await response.data
      .pipe(fs.createWriteStream(tmpFile))
      .on("finish", async () => {
        const form = new FormData();
        form.append("name", fileName);
        form.append("file", fs.createReadStream(tmpFile));

        await axios
          .post("https://pixeldrain.com/api/file/", form, {
            headers: form.getHeaders(),
          })
          .then(async (response) => {
            console.log(`File uploaded successfully`);

            try {
              axios
                .post(
                  `https://csclub.uwaterloo.ca/~phthakka/1pt/addURL.php?url=https://pixeldrain.com/api/file/${response.data.id}?download`
                )
                .then((shrtUrl) => {
                  ctx.editMessageText(
                    "<b>ＦＩＬＥ  ＤＥＴＡＩＬＳ</b>\n\n◌ <b>File Name ⇨ </b><i>" +
                      fileName +
                      "</i>\n◌ <b>File Size ⇨ </b><i>" +
                      fileSize +
                      "</i>\n◌ <b>File Type ⇨ </b><i>" +
                      fileType +
                      "</i>\n\n<b>ＤＯＷＮＬＯＡＤ  ＬＩＮＫ</b>\n\n◌ <b>Short URL ⇨ </b><code>https://1pt.co/" +
                      shrtUrl.data.short +
                      "</code>\n◌ <b>Long URL ⇨ </b>https://pixeldrain.com/api/file/" +
                      response.data.id +
                      "?download",
                    {
                      parse_mode: "HTML",
                    }
                  );
                });
            } catch (error) {
              console.error(error);
            }

            fs.unlinkSync(tmpFile);
            tmp.setGracefulCleanup();

            console.log(`Temp file deleted: ${tmpFile}`);
          })
          .catch(async (error) => {
            console.error(`Error uploading file: ${error}`);
            await ctx.editMessageText(
              `⚠️ *Error uploading file:*\n\n _${error}_`,
              {
                parse_mode: "Markdown",
              }
            );
          });
      });
  });
});

// Code when user clicks on "Gofile" button
bot.action("gofile", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ *Uploading file to Gofile...*`, {
    parse_mode: "Markdown",
  });

  await axios({
    url: fileUrl.toString(),
    method: "GET",
    responseType: "stream",
  }).then(async (response) => {
    console.log(`File retrieved successfully`);

    response.data.pipe(fs.createWriteStream(tmpFile)).on("finish", () => {
      const form = new FormData();
      form.append("file", fs.createReadStream(tmpFile));

      let gofileServer;
      axios({
        url: "https://api.gofile.io/getServer",
        method: "GET",
      })
        .then(async (getserver) => {
          console.log(getserver.data.data.server);
          gofileServer = getserver.data.data.server;

          await axios
            .post(`https://${gofileServer}.gofile.io/uploadFile`, form, {
              headers: form.getHeaders(),
            })
            .then(async (response) => {
              console.log(`File uploaded successfully`);

              try {
                axios
                  .post(
                    "https://csclub.uwaterloo.ca/~phthakka/1pt/addURL.php?url=" +
                      response.data.data.downloadPage
                  )
                  .then(async (shrtUrl) => {
                    ctx.editMessageText(
                      "<b>ＦＩＬＥ  ＤＥＴＡＩＬＳ</b>\n\n◌ <b>File Name ⇨ </b><i>" +
                        fileName +
                        "</i>\n◌ <b>File Size ⇨ </b><i>" +
                        fileSize +
                        "</i>\n◌ <b>File Type ⇨ </b><i>" +
                        fileType +
                        "</i>\n\n<b>ＤＯＷＮＬＯＡＤ  ＬＩＮＫ</b>\n\n◌ <b>Short URL ⇨ </b><code>https://1pt.co/" +
                        shrtUrl.data.short +
                        "</code>\n◌ <b>Long URL ⇨ </b>" +
                        response.data.data.downloadPage,
                      {
                        parse_mode: "HTML",
                      }
                    );
                  });
              } catch (error) {
                console.error(error);
              }
            });

          fs.unlinkSync(tmpFile);
          tmp.setGracefulCleanup();

          console.log(`Temp file deleted: ${tmpFile}`);
        })
        .catch(async (error) => {
          console.error(`Error uploading file: ${error}`);
          await ctx.editMessageText(
            `⚠️ *Error uploading file:*\n\n _${error}_`,
            {
              parse_mode: "Markdown",
            }
          );
        });
    });
  });
});

// Code when user clicks on "NekoFile" button
bot.action("nekofile", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ *Uploading file to NekoFile...*`, {
    parse_mode: "Markdown",
  });

  await axios({
    url: fileUrl.toString(),
    method: "GET",
    responseType: "stream",
  }).then(async (response) => {
    console.log(`File retrieved successfully`);

    await response.data
      .pipe(fs.createWriteStream(tmpFile))
      .on("finish", async () => {
        const form = new FormData();
        form.append("file", fs.createReadStream(tmpFile));

        await axios
          .post("https://nekofile.eu.org/", form, {
            headers: form.getHeaders(),
          })
          .then(async (response) => {
            console.log(`File uploaded successfully`);

            try {
              axios
                .post(
                  `https://csclub.uwaterloo.ca/~phthakka/1pt/addURL.php?url=${response.data}`
                )
                .then((shrtUrl) => {
                  ctx.editMessageText(
                    "<b>ＦＩＬＥ  ＤＥＴＡＩＬＳ</b>\n\n◌ <b>File Name ⇨ </b><i>" +
                      fileName +
                      "</i>\n◌ <b>File Size ⇨ </b><i>" +
                      fileSize +
                      "</i>\n◌ <b>File Type ⇨ </b><i>" +
                      fileType +
                      "</i>\n\n<b>ＤＯＷＮＬＯＡＤ  ＬＩＮＫ</b>\n\n◌ <b>Short URL ⇨ </b><code>https://1pt.co/" +
                      shrtUrl.data.short +
                      "</code>\n◌ <b>Long URL ⇨ </b>" +
                      response.data,
                    {
                      parse_mode: "HTML",
                    }
                  );
                });
            } catch (error) {
              console.error(error);
            }

            fs.unlinkSync(tmpFile);
            tmp.setGracefulCleanup();

            console.log(`Temp file deleted: ${tmpFile}`);
          })
          .catch(async (error) => {
            console.error(`Error uploading file: ${error}`);
            await ctx.editMessageText(
              `⚠️ *Error uploading file:*\n\n _${error}_`,
              {
                parse_mode: "Markdown",
              }
            );
          });
      });
  });
});

// Code when user clicks on "FileIo" button
bot.action("fileio", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ *Uploading file to FileIo...*`, {
    parse_mode: "Markdown",
  });

  await axios({
    url: fileUrl.toString(),
    method: "GET",
    responseType: "stream",
  }).then(async (response) => {
    console.log(`File retrieved successfully`);

    await response.data
      .pipe(fs.createWriteStream(tmpFile))
      .on("finish", async () => {
        const form = new FormData();
        form.append("file", fs.createReadStream(tmpFile));
        form.append("expires", "30d");
        form.append("autoDelete", "true");

        await axios
          .post("https://file.io/", form, {
            headers: form.getHeaders(),
          })
          .then(async (response) => {
            console.log(`File uploaded successfully`);

            try {
              axios
                .post(
                  `https://csclub.uwaterloo.ca/~phthakka/1pt/addURL.php?url=${response.data.link}`
                )
                .then((shrtUrl) => {
                  ctx.editMessageText(
                    "<b>ＦＩＬＥ  ＤＥＴＡＩＬＳ</b>\n\n◌ <b>File Name ⇨ </b><i>" +
                      fileName +
                      "</i>\n◌ <b>File Size ⇨ </b><i>" +
                      fileSize +
                      "</i>\n◌ <b>File Type ⇨ </b><i>" +
                      fileType +
                      "</i>\n\n<b>ＤＯＷＮＬＯＡＤ  ＬＩＮＫ</b>\n\n◌ <b>Short URL ⇨ </b><code>https://1pt.co/" +
                      shrtUrl.data.short +
                      "</code>\n◌ <b>Long URL ⇨ </b>" +
                      response.data.link,
                    {
                      parse_mode: "HTML",
                    }
                  );
                });
            } catch (error) {
              console.error(error);
            }

            fs.unlinkSync(tmpFile);
            tmp.setGracefulCleanup();

            console.log(`Temp file deleted: ${tmpFile}`);
          })
          .catch(async (error) => {
            console.error(`Error uploading file: ${error}`);
            await ctx.editMessageText(
              `⚠️ *Error uploading file:*\n\n _${error}_`,
              {
                parse_mode: "Markdown",
              }
            );
          });
      });
  });
});

// Code when user clicks on "DropFile" button
bot.action("dropfile", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ *Uploading file to DropFile...*`, {
    parse_mode: "Markdown",
  });

  await axios({
    url: fileUrl.toString(),
    method: "GET",
    responseType: "stream",
  }).then(async (response) => {
    console.log(`File retrieved successfully`);

    await response.data
      .pipe(fs.createWriteStream(tmpFile))
      .on("finish", async () => {
        const form = new FormData();
        form.append("file", fs.createReadStream(tmpFile));

        await axios
          .post(`https://dropfile.repl.co/`, form, {
            headers: form.getHeaders(),
          })
          .then(async (response) => {
            console.log(`File uploaded successfully`);

            try {
              axios
                .post(
                  `https://csclub.uwaterloo.ca/~phthakka/1pt/addURL.php?url=${response.data}`
                )
                .then((shrtUrl) => {
                  ctx.editMessageText(
                    "<b>ＦＩＬＥ  ＤＥＴＡＩＬＳ</b>\n\n◌ <b>File Name ⇨ </b><i>" +
                      fileName +
                      "</i>\n◌ <b>File Size ⇨ </b><i>" +
                      fileSize +
                      "</i>\n◌ <b>File Type ⇨ </b><i>" +
                      fileType +
                      "</i>\n\n<b>ＤＯＷＮＬＯＡＤ  ＬＩＮＫ</b>\n\n◌ <b>Short URL ⇨ </b><code>https://1pt.co/" +
                      shrtUrl.data.short +
                      "</code>\n◌ <b>Long URL ⇨ </b>" +
                      response.data,
                    {
                      parse_mode: "HTML",
                    }
                  );
                });
            } catch (error) {
              console.error(error);
            }

            fs.unlinkSync(tmpFile);
            tmp.setGracefulCleanup();

            console.log(`Temp file deleted: ${tmpFile}`);
          })
          .catch(async (error) => {
            console.error(`Error uploading file: ${error}`);
            await ctx.editMessageText(
              `⚠️ *Error uploading file:*\n\n _${error}_`,
              {
                parse_mode: "Markdown",
              }
            );
          });
      });
  });
});

// Code when user clicks on "Anonymfile" button
bot.action("anonymfile", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ *Uploading file to Anonymfile...*`, {
    parse_mode: "Markdown",
  });

  await axios({
    url: fileUrl.toString(),
    method: "GET",
    responseType: "stream",
  }).then(async (response) => {
    console.log(`File retrieved successfully`);

    await response.data
      .pipe(fs.createWriteStream(tmpFile))
      .on("finish", async () => {
        const form = new FormData();
        form.append("file", fs.createReadStream(tmpFile));

        await axios
          .post(`https://anonymfile.com/api/v1/upload/`, form, {
            headers: form.getHeaders(),
          })
          .then(async (response) => {
            console.log(`File uploaded successfully`);

            try {
              axios
                .post(
                  `https://csclub.uwaterloo.ca/~phthakka/1pt/addURL.php?url=${response.data.data.file.url.short}`
                )
                .then((shrtUrl) => {
                  ctx.editMessageText(
                    "<b>ＦＩＬＥ  ＤＥＴＡＩＬＳ</b>\n\n◌ <b>File Name ⇨ </b><i>" +
                      fileName +
                      "</i>\n◌ <b>File Size ⇨ </b><i>" +
                      fileSize +
                      "</i>\n◌ <b>File Type ⇨ </b><i>" +
                      fileType +
                      "</i>\n\n<b>ＤＯＷＮＬＯＡＤ  ＬＩＮＫ</b>\n\n◌ <b>Short URL ⇨ </b><code>https://1pt.co/" +
                      shrtUrl.data.short +
                      "</code>\n◌ <b>Long URL ⇨ </b>" +
                      response.data.data.file.url.short,
                    {
                      parse_mode: "HTML",
                    }
                  );
                });
            } catch (error) {
              console.error(error);
            }

            fs.unlinkSync(tmpFile);
            tmp.setGracefulCleanup();

            console.log(`Temp file deleted: ${tmpFile}`);
          })
          .catch(async (error) => {
            console.error(`Error uploading file: ${error}`);
            await ctx.editMessageText(
              `⚠️ *Error uploading file:*\n\n _${error}_`,
              {
                parse_mode: "Markdown",
              }
            );
          });
      });
  });
});

// Code when user clicks on "TransferSh" button
bot.action("transfersh", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ *Uploading file to Transfer.sh...*`, {
    parse_mode: "Markdown",
  });

  await axios({
    url: fileUrl.toString(),
    method: "GET",
    responseType: "stream",
  }).then(async (response) => {
    console.log(`File retrieved successfully`);

    await response.data
      .pipe(fs.createWriteStream(tmpFile))
      .on("finish", async () => {
        const form = new FormData();
        form.append("file", fs.createReadStream(tmpFile));

        await axios
          .post(`https://transfer.sh`, form, {
            headers: form.getHeaders(),
          })
          .then(async (response) => {
            console.log(`File uploaded successfully`);
            let rawurl = response.data;
            let url = rawurl.replace("https://transfer.sh/", "https://transfer.sh/get/");

            try {
              axios
                .post(
                  `https://csclub.uwaterloo.ca/~phthakka/1pt/addURL.php?url=${url}`
                )
                .then((shrtUrl) => {
                  ctx.editMessageText(
                    "<b>ＦＩＬＥ  ＤＥＴＡＩＬＳ</b>\n\n◌ <b>File Name ⇨ </b><i>" +
                      fileName +
                      "</i>\n◌ <b>File Size ⇨ </b><i>" +
                      fileSize +
                      "</i>\n◌ <b>File Type ⇨ </b><i>" +
                      fileType +
                      "</i>\n\n<b>ＤＯＷＮＬＯＡＤ  ＬＩＮＫ</b>\n\n◌ <b>Short URL ⇨ </b><code>https://1pt.co/" +
                      shrtUrl.data.short +
                      "</code>\n◌ <b>Long URL ⇨ </b>" +
                      url,
                    {
                      parse_mode: "HTML",
                    }
                  );
                });
            } catch (error) {
              console.error(error);
            }

            fs.unlinkSync(tmpFile);
            tmp.setGracefulCleanup();

            console.log(`Temp file deleted: ${tmpFile}`);
          })
          .catch(async (error) => {
            console.error(`Error uploading file: ${error}`);
            await ctx.editMessageText(
              `⚠️ *Error uploading file:*\n\n _${error}_`,
              {
                parse_mode: "Markdown",
              }
            );
          });
      });
  });
});

// Code when user clicks on "FileRio" button
bot.action("filerio", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(`⏳ *Uploading file to FileRio...*`, {
    parse_mode: "Markdown",
  });

  await axios({
    url: fileUrl.toString(),
    method: "GET",
    responseType: "stream",
  }).then(async (response) => {
    console.log(`File retrieved successfully`);

    await response.data
      .pipe(fs.createWriteStream(tmpFile))
      .on("finish", async () => {
        const form = new FormData();
        form.append("file", fs.createReadStream(tmpFile));

        await axios
          .post(`https://ng2.filerio.in/cgi-bin/upload.cgi?upload_type=file&utype=anon`, form, {
            headers: form.getHeaders(),
          })
          .then(async (response) => {
            console.log(`File uploaded successfully`);

            try {
              console.log(response.data[0].file_code);
              axios
                .post(
                  `https://csclub.uwaterloo.ca/~phthakka/1pt/addURL.php?url=https://filerio.in/${response.data[0].file_code}`
                )
                .then((shrtUrl) => {
                  ctx.editMessageText(
                    "<b>ＦＩＬＥ  ＤＥＴＡＩＬＳ</b>\n\n◌ <b>File Name ⇨ </b><i>" +
                      fileName +
                      "</i>\n◌ <b>File Size ⇨ </b><i>" +
                      fileSize +
                      "</i>\n◌ <b>File Type ⇨ </b><i>" +
                      fileType +
                      "</i>\n\n<b>ＤＯＷＮＬＯＡＤ  ＬＩＮＫ</b>\n\n◌ <b>Short URL ⇨ </b><code>https://1pt.co/" +
                      shrtUrl.data.short +
                      "</code>\n◌ <b>Long URL ⇨ </b>https://filerio.in/" +
                      response.data[0].file_code,
                    {
                      parse_mode: "HTML",
                    }
                  );
                });
            } catch (error) {
              console.error(error);
            }

            fs.unlinkSync(tmpFile);
            tmp.setGracefulCleanup();

            console.log(`Temp file deleted: ${tmpFile}`);
          })
          .catch(async (error) => {
            console.error(`Error uploading file: ${error}`);
            await ctx.editMessageText(
              `⚠️ *Error uploading file:*\n\n _${error}_`,
              {
                parse_mode: "Markdown",
              }
            );
          });
      });
  });
});

app.listen(port, () => {
  console.log(`Bot is running on port ${port}`);
});

bot.launch();
