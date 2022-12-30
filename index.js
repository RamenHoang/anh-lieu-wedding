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
});
app.use(i18n.init);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  req.setLocale("vi");

  const [rows, fields] = await global.connection.execute(
    "SELECT * FROM wishes ORDER BY datetime DESC"
  );

  return res.render("index", {
    http_host: process.env.HOST,
    wedding_date: process.env.WEDDING_DATE,
    wedding_datetime: process.env.WEDDING_DATETIME,
    google_map_link: process.env.GOOGLE_MAP_LINK,
    map_link: process.env.DOWNLOAD_MAP_LINK,
    audio_path: process.env.AUDIO_PATH,
    wishes: rows,
  });
});

app.post("/wishes", async (req, res) => {
  const [rows, fields] = await global.connection.execute(
    "INSERT INTO wishes (name, email, content) VALUES (?, ?, ?)",
    [req.body.name, req.body.email, req.body.content]
  );

  res.redirect("/#wishes");
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
