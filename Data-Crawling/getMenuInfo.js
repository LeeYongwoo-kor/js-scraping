import puppeteer from "puppeteer";
import fs from "fs";

const __dirname = "Json";

const drink = [
  "カクテル",
  "アルコール",
  "ウイスキー",
  "ワイン",
  "焼酎",
  "日本酒",
];
const dessert = ["デザート"];

const changeNameList = {
  特選フルーツトマト: "特選フルーツトマト『きわめ』加藤農園",
  ごぼうときゅうりのシャッキリ: "ごぼうときゅうりのシャッキリサラダ",
  五目さつま揚げ: "五目さつま揚げ",
  ズワイガニクリームコロッケ: "ズワイガニクリームコロッケ（１個）",
  ちりめん山椒としば漬け: "ちりめん山椒としば漬けの出汁茶漬け",
  酒屋が作った甘酒: "酒屋が作った甘酒(アルコール0%)",
  "②モンテス": "モンテス・クラシックシリーズ・カベルネソーヴィニヨン",
  "⑦モンテス": "モンテス・クラシックシリーズ・シャルドネ",
  カッシーナ: "カッシーナ・キッコ・ランゲ・ネッビオーロ",
  モンテスクラシックシリーズ:
    "モンテスクラシックシリーズ・カベルネソーヴィニヨン",
  タクンレセルヴ: "タクンレセルヴァ・カベルネ・ソーヴィニヨン",
  鳳凰美田: "【鳳凰美田】（初しぼり純米吟醸酒）",
};

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
    (nodes, categories, drink, dessert, changeNameList) => {
      let menuId = 1;
      return nodes.map((node, idx) => {
        const sub = categories[idx].replaceAll(/[【】]|[\(].+/g, "");
        const dishes = Array.from(node.querySelectorAll("td > div"));
        const details = dishes.reduce((acc, dish) => {
          let category = 0;
          let alcohol = 0;
          const div = Array.from(dish.querySelectorAll("div"));
          const isDrink = drink.some((el) => categories[idx].indexOf(el) > -1);
          if (isDrink) {
            category = 1;
          } else if (categories[idx]?.includes(dessert)) {
            category = 2;
          }
          const status = div.length > 1 ? 1 : 0;
          const dishInfo = div.length > 1 ? div[1] : div[0];
          let name = dishInfo.querySelector("p").textContent;
          if (name.includes("…")) {
            for (const [key, value] of Object.entries(changeNameList)) {
              if (name.includes(key)) {
                name = value;
                break;
              }
            }
          }
          if (name.includes("【N】")) {
            name = name.replaceAll("【N】", "");
          }
          const recommendation = 0;
          const description = "";
          const price = dishInfo
            .querySelector("span")
            .textContent.replace(/[^0-9]/g, "");
          const imageUrl = dish.querySelector("img").src;
          let regdate = "00000000";
          try {
            const extractDate = imageUrl
              .split("/")
              .at(-1)
              .replace("hosei_", "")
              .substring(0, 8);
            regdate = `${extractDate.slice(0, 4)}-${extractDate.slice(
              4,
              6
            )}-${extractDate.slice(6)}`;
          } catch (err) {
            console.error(err);
          }

          const obj = {
            id: menuId++,
            category,
            sub,
            name,
            price: +price,
            imageUrl,
            status,
            alcohol,
            recommendation,
            description,
            regdate,
          };

          return [...(acc || []), obj];
        }, []);

        return details;
      });
    },
    categories,
    drink,
    dessert,
    changeNameList
  );

  const flatMenu = menu.flat();

  const imageUrl = flatMenu.map((dish) => {
    const { imageUrl } = dish;
    return imageUrl;
  });

  // ImageDownload
  for (let i = 0; i < imageUrl.length; i++) {
    const viewSource = await page.goto(imageUrl[i]);
    const buffer = await viewSource.buffer();

    // Change the file path and name to match where you want to save the image
    fs.writeFileSync(`./menu_img/restaurant_menu_${i}.png`, buffer);
  }

  await browser.close();

  fs.writeFile(`../${__dirname}/menu.json`, JSON.stringify(flatMenu), (err) =>
    err ? console.log(err) : console.log("SUCCESS!!")
  );
})();
