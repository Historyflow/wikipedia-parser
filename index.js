const fs = require("fs");
const fetcher = require("./node-wikipedia");
const $ = require("cheerio");
const wtfWikipedia = require("wtf_wikipedia");

const workWithHtml = module.exports.workWithHtml = function(file) {
  var article = fs.readFileSync(`./data/${ file }`);

  var text = JSON.parse(article).text["*"];
  var cleanedText = text.replace(/\\/g, "").replace(/\n/g, "");
  return cleanedText;
};

const getArticle = module.exports.getArticle = function(name, category) {
  if (!category) category = "";

  var cleanedName = name.replace(/ /g, "_");
  fetcher.page.data(cleanedName, { content: true }, page => {
    delete page.links;
    delete page.categories;
    delete page.redirects;

    page.id = page.pageid;
    delete page.pageid;

    page.name = page.title;
    delete page.title;

    // page.description = wtfWikipedia.plaintext(description);

    page.class = {};
    page.type = {};

    page.children_ids = [];
    page.connections_ids = [];
    page.shapes_ids = [];
    page.context = {};
    page.context_dataset = [];

    page.text = page.text["*"].replace(/\\/g, "").replace(/\n/g, "").replace(/"/g, "'");

    page.description = $(page.text).filter(".infobox").first().next().text();

    var parsed = wtfWikipedia.parse(page.wikitext["*"]);
    page.info = parsed.infobox;

    delete page.wikitext;

    var dates = [];
    if (parsed.infobox.date && parsed.infobox.date.text) {
      if (parsed.infobox.date.text.includes("—")) {
        dates = parsed.infobox.date.text.split("—");
      } else {
        if (parsed.infobox.date.text.includes("-")) {
          dates = parsed.infobox.date.text.split("-");
        } else {
          dates = [parsed.infobox.date.text, parsed.infobox.date.text];
        }
      }
    }
    dates = dates.map(date => {
      let parsedDate = parseInt(date, 10);
      if (date.includes("до н. э.")) {
        parsedDate = -parsedDate;
      }
      return "" + parsedDate;
    });
    if (dates.length) {
      page.start_date = dates[0].trim();
      page.end_date = dates[1].trim();
    } else {
      page.start_date = "";
      page.end_date = "";
    }

    fs.writeFile(`./data/${ category.length ? category + "/" : "" }${cleanedName}.json`, JSON.stringify(page), err => { if (err) { console.log(err); } });
  });
};

const getCategory = module.exports.getCategory = function(category) {
  fetcher.categories.tree(category, { lang: "ru" }, result => {
    fs.mkdirSync(`./data/${ result.name.replace(/ /g, "_") }`);
    result.pages.forEach(page => {
      // console.log("#################################");
      // console.log(page);
      // console.log("---------------------------------");
      getArticle(page, category);
    });
    result.subcategories.forEach(subcat => {
      getCategory(subcat.name.replace(/ /g, "_"));
    });
  });
};

const setClassBulk = module.exports.setClassBulk = function(dir, classObj) {
  fs.readdir(`./data/${dir}`, (err, files) => {
    if (err) console.log(err);
    console.log(files);
    files.forEach(file => {
      fs.readFile(`./data/${dir}/${file}`, (err, content) => {
        if (err) console.log(err);
        let parsed = JSON.parse(content);
        parsed.class = classObj;
        fs.writeFile(`./data/${dir}/${file}`, JSON.stringify(parsed), err => { if (err) console.log(err); });
      });
    });
  });
};

const getGroup = module.exports.getGroup = function(group) {
  // var elements = ["Римская_республика", "Карфаген", "Этолийский_союз", "Пергамское_царство", "Спарта", "Нумидия", "Древняя_Македония", "Сиракузы", "Ахейский_союз", "Капуя"];

  var elements = [
    "Публий_Корнелий_Сципион_(консул_218_года_до_н._э.)",
    "Гней_Корнелий_Сципион_Кальв",
    "Тиберий_Семпроний_Лонг_(консул_218_года_до_н._э.)",
    "Гай_Фламиний",
    "Гней_Сервилий_Гемин",
    "Марк_Атилий_Регул_(консул_227_года_до_н._э.)",
    "Квинт_Фабий_Максим_Кунктатор",
    "Марк_Минуций_Руф_(консул_221_года_до_н._э.)",
    "Луций_Эмилий_Павел_(консул_219_года_до_н._э.)",
    "Гай_Теренций_Варрон",
    "Марк_Клавдий_Марцелл_(консул_222_года_до_н._э.)",
    "Марк_Ливий_Салинатор",
    "Гай_Клавдий_Нерон",
    "Публий_Корнелий_Сципион_Африканский",
    "Сифакс",
    "Ганнибал",
    "Гасдрубал_Баркид",
    "Магон_Баркид",
    "Гасдрубал_Гискон",
    "Магарбал",
    "Ганнон_Старший",
    "Ганнон,_сын_Бомилькара",
    "Филипп_V_Македонский",
    "Филопемен"
  ];

  if (!fs.statSync(`./data/${group}`).isDirectory()) {
    fs.mkdirSync(`./data/${group}`);
  }

  elements.forEach(state => {
    getArticle(state, group);
  });
};

const getIds = module.exports.getIds = function(group, idsList) {
  fs.readdir(`./data/${group}`, (err, files) => {
    if (err) console.log(err);
    files.forEach(file => {
      fs.readFile(`./data/${group}/${file}`, (err, content) => {
        if (err) console.log(err);
        let parsed = JSON.parse(content);
        idsList.push(parsed.id);
      });
    });
  });
};
