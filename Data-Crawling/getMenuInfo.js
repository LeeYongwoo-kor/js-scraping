import puppeteer from "puppeteer";
import fs from "fs";

const __dirname = "Json";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(
    "https://dining-menu.com/menu_system/sample_menu3/top.php?sc=215036&n=0&r=1Y"
  );

  const categories = await page.$$eval("table[id^=cate_]", (nodes) => {
    return nodes.map((node) => {
      const name = node.querySelector("td").textContent.replace(/\t|\n/g, "");
      return name;
    });
  });

  const menu = await page.$$eval(
    "div[id^=menu_]",
    (nodes, categories) => {
      let menuId = 1;
      return nodes.map((node, idx) => {
        const dishes = Array.from(node.querySelectorAll("td > div"));
        const details = dishes.reduce((acc, dish) => {
          const div = Array.from(dish.querySelectorAll("div"));
          const category = categories[idx];
          const status = div.lengh > 1 ? 1 : 0;
          const dishInfo = div.length > 1 ? div[1] : div[0];
          const name = dishInfo.querySelector("p").textContent;
          const price = dishInfo
            .querySelector("span")
            .textContent.replace(/[^0-9]/g, "");
          const imageUrl = dish.querySelector("img").src;

          const obj = {
            id: menuId++,
            category,
            name,
            price,
            imageUrl,
            status,
          };

          return [...(acc || []), obj];
        }, []);

        return details;
      });
    },
    categories
  );

  const json = menu.flat();

  await browser.close();

  fs.writeFile(`../${__dirname}/menu.json`, JSON.stringify(json), (err) =>
    err ? console.log(err) : console.log("SUCCESS!!")
  );
})();
