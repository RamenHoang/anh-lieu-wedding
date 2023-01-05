const fs = require("fs");
const readline = require("readline");
const events = require("events");

async function processLineByLine(filePath, callback) {
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    rl.on("line", callback);

    await events.once(rl, "close");

    console.log(`Reading file "${filePath}" line by line with readline done.`);
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`
    );
  } catch (err) {
    console.error(err);
  }
}

async function writeLine(filePath, data) {
  try {
    return await fs.promises.appendFile(filePath, data.join('\t'), {
      encoding: 'utf-8',
    });
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  processLineByLine,
  writeLine,
};
