require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const i18n = require("i18n");
const fileHandler = require("./file-handler");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
i18n.configure({
  locales: ["en", "vi"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "vi",
  updateFiles: false,
  syncFiles: true,
});
app.use(i18n.init);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (process.env.ENV == "local") {
    req.headers.host = process.env.GROOM_HOST;
  }

  next();
});

app.get("/", async (req, res) => {
  req.setLocale("vi");

  const wishes = await getWishes();
  const extra = {};

  if (req.headers.host == process.env.GROOM_HOST) {
    extra.map_path = process.env.GROOM_MAP_IMAGE_PATH;
    extra.groom = true;
    extra.bride = false;
    extra.map_link = process.env.GROOM_GOOGLE_MAP_LINK;
    extra.google_map_link = process.env.GROOM_GOOGLE_MAP_LINK;
  } else if (req.headers.host == process.env.BRIDE_HOST) {
    extra.map_path = process.env.BRIDE_MAP_IMAGE_PATH;
    extra.groom = false;
    extra.bride = true;
    extra.map_link = process.env.BRIDE_GOOGLE_MAP_LINK;
    extra.google_map_link = process.env.BRIDE_GOOGLE_MAP_LINK;
  }

  return res.render("index", {
    http_host: process.env.HOST,
    wedding_date: process.env.WEDDING_DATE,
    wedding_datetime: process.env.WEDDING_DATETIME,
    audio_path: process.env.AUDIO_PATH,
    wishes: wishes,
    ...extra,
  });
});

app.post("/wishes", async (req, res) => {
  try {
    if (!req.body.name || !req.body.content) {
      res.status(400);
      return;
    }

    await fileHandler.writeLine(
      path.join(__dirname, process.env.WISHES_DATA_FILENAME),
      [req.body.name, req.body.email, req.body.content]
    );

    const wishes = await getWishes();

    res.status(200).render("components/parts/wishes", {
      wishes,
    });
  } catch (e) {
    res.status(400).json(e);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});

async function getWishes() {
  const _rows = [];

  await fileHandler.processLineByLine(
    path.join(__dirname, process.env.WISHES_DATA_FILENAME),
    function (line) {
      _rows.push(line);
    }
  );

  const wishes = _rows.map(function (row) {
    const wishData = row.split("\t");

    return {
      name: wishData[0],
      email: wishData[1],
      content: wishData[2],
    };
  });

  return wishes.reverse();
}
