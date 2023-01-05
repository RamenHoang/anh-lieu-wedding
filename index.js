require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const i18n = require("i18n");
const mysql = require("./mysql");

async function start() {
  global.connection = await mysql.init();
}

start();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
i18n.configure({
  locales: ["en", "vi"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "vi",
  updateFiles: false,
  syncFiles: true
});
app.use(i18n.init);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  req.setLocale("vi");

  const [rows, fields] = await global.connection.execute(
    "SELECT * FROM wishes ORDER BY datetime DESC"
  );

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
    wishes: rows,
    ...extra,
  });
});

app.post("/wishes", async (req, res) => {
  try {
    await global.connection.execute(
      "INSERT INTO wishes (name, email, content) VALUES (?, ?, ?)",
      [req.body.name, req.body.email, req.body.content]
    );

    const [rows, fields] = await global.connection.execute(
      "SELECT * FROM wishes ORDER BY datetime DESC"
    );

    res.status(200).render("components/parts/wishes", {
      wishes: rows,
    });
  } catch (e) {
    res.status(400).json(e);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
