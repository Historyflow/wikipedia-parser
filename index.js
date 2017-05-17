const fs = require("fs");
const fetcher = require("./node-wikipedia");
const $ = require("cheerio");
const wtfWikipedia = require("wtf_wikipedia");

const workWithHtml = module.exports.workWithHtml = function(file) {
  var article = fs.readFileSync(`${__dirname}/data/${ file }`);

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
      if (date.includes("BC")) {
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

    fs.writeFile(`${__dirname}/data/${ category.length ? category + "/" : "" }${cleanedName}.json`, JSON.stringify(page), err => { if (err) { console.log(err); } });
  });
};

const getCategory = module.exports.getCategory = function(category) {
  fetcher.categories.tree(category, { lang: "en" }, result => {
    fs.mkdirSync(`${__dirname}/data/${ result.name.replace(/ /g, "_") }`);
    let pagesCount = 0;
    result.pages.forEach(page => {
      // console.log("#################################");
      // console.log("---------------------------------");
      getArticle(page, category);
      console.log(pagesCount++);
    });
    result.subcategories.forEach(subcat => {
      getCategory(subcat.name.replace(/ /g, "_"));
    });
  });
};

const setClassBulk = module.exports.setClassBulk = function(dir, classObj) {
  fs.readdir(`${__dirname}/data/${dir}`, (err, files) => {
    if (err) console.log(err);
    console.log(files);
    files.forEach(file => {
      fs.readFile(`${__dirname}/data/${dir}/${file}`, (err, content) => {
        if (err) console.log(err);
        let parsed = JSON.parse(content);
        parsed.class = classObj;
        fs.writeFile(`${__dirname}/data/${dir}/${file}`, JSON.stringify(parsed), err => { if (err) console.log(err); });
      });
    });
  });
};

const getProcess = module.exports.getProcess = function(proc) {
  try {
    if (!fs.statSync(`${__dirname}/data/${proc}`).isDirectory()) {
       fs.mkdirSync(`${__dirname}/data/${proc}`);
    }
  } catch (Error) {
    fs.mkdirSync(`${__dirname}/data/${proc}`);
  }

  let cats = [
    {
      name: "states",
      elements: [
        "Roman_Republic",
        "Ancient_Carthage",
        "Aetolian_League",
        "Pergamon",
        "Syracuse,_Sicily",
        "Macedonia_(ancient_kingdom)",
        "Ptolemaic_Kingdom",
        "Seleucid_Empire",
        "Epirus_(ancient_state)"
      ]
    },
    {
      name: "personas",
      elements: [
        "Publius_Cornelius_Scipio",
        "Tiberius_Sempronius_Longus_(consul_218_BCE)",
        "Scipio_Africanus",
        "Gaius_Flaminius",
        "Quintus_Fabius_Maximus_Verrucosus",
        "Marcus_Claudius_Marcellus",
        "Lucius_Aemilius_Paullus_(General)",
        "Gaius_Terentius_Varro",
        "Marcus_Livius_Salinator",
        "Gaius_Claudius_Nero",
        "Gnaeus_Cornelius_Scipio_Calvus",
        "Masinissa",
        "Marcus_Minucius_Rufus_(consul_221_BC)",
        "Gnaeus_Servilius_Geminus",
        "Hannibal",
        "Hasdrubal_(Barcid)",
        "Mago_(Barcid)",
        "Hasdrubal_Gisco",
        "Syphax",
        "Hanno_the_Elder",
        "Hasdrubal_the_Bald",
        "Maharbal",
        "Philip_V_of_Macedon",
        "Archimedes"
      ]
    },
    {
      name: "places",
      elements: [
        "Carthage",
        "Rome",
        "Sagunto",
        "Benevento",
        "Cremona",
        "Cádiz",
        "Hippo_Regius",
        "Málaga",
        "Marseille",
        "Messina",
        "Naples",
        "Cartagena,_Spain",
        "Ostia_Antica",
        "Piacenza",
        "Reggio_Calabria",
        "Taranto",
        "History_of_Taranto",
        "Utica,_Tunisia"
      ]
    },
    {
      name: "events",
      elements: [
        "Siege_of_Syracuse_(214–212_BC)",
        "Macedonian–Carthaginian_Treaty",
        "Battle_of_Lilybaeum",
        "Battle_of_Rhone_Crossing",
        "Battle_of_Ticinus",
        "Battle_of_the_Trebia",
        "Battle_of_Cissa",
        "Battle_of_Lake_Trasimene",
        "Battle_of_Ebro_River",
        "Battle_of_Ager_Falernus",
        "Battle_of_Geronium",
        "Battle_of_Cannae",
        "Battle_of_Nola_(216_BC)",
        "Battle_of_Nola_(215_BC)",
        "Battle_of_Dertosa",
        "Battle_of_Nola_(214_BC)",
        "Battle_of_Beneventum_(214_BC)",
        "Battle_of_Tarentum_(212_BC)",
        "Battle_of_Capua",
        "Battle_of_the_Silarus",
        "Battle_of_Herdonia_(212_BC)",
        "Battle_of_the_Upper_Baetis",
        "Battle_of_Capua_(211_BC)",
        "Battle_of_Herdonia_(210_BC)",
        "Battle_of_Numistro",
        "Battle_of_Canusium",
        "Assault_on_Cartagena",
        "Battle_of_Baecula",
        "Battle_of_Grumentum",
        "Battle_of_the_Metaurus",
        "Battle_of_Ilipa",
        "Battle_of_Crotona",
        "Battle_of_Bagbrades",
        "Battle_of_Zama"
      ]
    }
  ]

  cats.forEach(cat => {
    getGroup(proc, cat.name, cat.elements)
  })

}

const getGroup = module.exports.getGroup = function(proc, group, elements) {
  try {
    if (!fs.statSync(`${__dirname}/data/${proc}/${group}`).isDirectory()) {
      fs.mkdirSync(`${__dirname}/data/${proc}/${group}`);
    }
  } catch (Error) {
    fs.mkdirSync(`${__dirname}/data/${proc}/${group}`);
  }

  elements.forEach(elem => {
    getArticle(elem, `${proc}/${group}`);
  });
};

const getIds = module.exports.getIds = function(group, idsList) {
  fs.readdir(`${__dirname}/data/${group}`, (err, files) => {
    if (err) console.log(err);
    files.forEach(file => {
      fs.readFile(`${__dirname}/data/${group}/${file}`, (err, content) => {
        if (err) console.log(err);
        let parsed = JSON.parse(content);
        idsList.push(parsed.id);
      });
    });
  });
};
