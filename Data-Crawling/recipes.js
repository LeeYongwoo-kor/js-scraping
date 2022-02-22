import puppeteer from "puppeteer";
import fs from "fs";

const __dirname = "Json";

const url = "https://www.tgwilkins.co.uk/recipes.html";
const selector = ".recipe-item";
(async function () {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const recipes = await page.$$eval(selector, (nodes) => {
    return nodes.map((node) => {
      const title = node.querySelector("h2").textContent;
      const description = node.querySelector("p").textContent;
      const img = node.querySelector("img").getAttribute("src");
      const detailTable = node.querySelector(".details");
      const detailRows = Array.from(detailTable.querySelectorAll("tr"));
      const details = detailRows.reduce((object, row) => {
        const columns = row.querySelectorAll("td");
        const { textContent: key } = columns[0];
        const { textContent: value } = columns[1];
        object[key] = value;
        return object;
      }, {});

      return {
        title,
        description,
        img,
        details,
      };
    });
  });

  await browser.close();

  fs.writeFile(`../${__dirname}/recipes.json`, JSON.stringify(recipes), (err) =>
    err ? console.log(err) : console.log("SUCCESS!!")
  );
})();
