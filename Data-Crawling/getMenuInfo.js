import puppeteer from "puppeteer";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const drink = [
  "カクテル",
  "アルコール",
  "ウイスキー",
  "ワイン",
  "焼酎",
  "日本酒",
];

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

const recommendList = [
  "あん肝（山口県産）",
  "しめさば",
  "カニトースト（１枚）",
  "黒毛和牛ロースステーキ",
];

const getMenuImageUrlList = async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(
      "https://dining-menu.com/menu_system/sample_menu3/top.php?sc=215036&n=0&r=1Y"
    );

    // カテゴリーの抽出(sub)
    const categories = await page.$$eval("table[id^=cate_]", (nodes) => {
      return nodes.map((node) => {
        const name = node
          ?.querySelector("td")
          ?.textContent.replace(/\t|\n/g, "");
        return name;
      });
    });

    // メニュー抽出
    const menu = await page.$$eval(
      "div[id^=menu_]",
      (nodes, categories, drink, changeNameList, recommendList) => {
        return nodes.map((node, idx) => {
          let recommendation = 0;
          const sub =
            categories && categories[idx].replaceAll(/[【】]|[\(].+/g, "");
          if (sub === "おすすめ") {
            recommendation = 1;
          }
          const dishes = Array.from(node.querySelectorAll("td > div"));
          const details = dishes.reduce((acc, dish) => {
            let category = 0;
            let alcohol = 0;
            const div = Array.from(dish.querySelectorAll("div"));
            const isDrink = drink?.some(
              (el) => categories && categories[idx].indexOf(el) > -1
            );
            if (isDrink) {
              category = 1;
            } else if (categories && categories[idx]?.includes(["デザート"])) {
              category = 2;
            }
            const status = div.length > 1 ? 1 : 0;
            const dishInfo = div.length > 1 ? div[1] : div[0];
            let name = dishInfo?.querySelector("p")?.textContent;
            if (name?.includes("…")) {
              for (const [key, value] of Object.entries(changeNameList)) {
                if (name.includes(key)) {
                  name = value;
                  break;
                }
              }
            }
            // if (recommendList.find((el) => name.indexOf(el) > -1)) {
            //   recommendation = 1;
            // }
            if (name?.includes("【N】")) {
              alcohol = 1;
              name = name.replaceAll("【N】", "");
            }
            const description = "";
            const price = dishInfo
              ?.querySelector("span")
              ?.textContent.replace(/[^0-9]/g, "");
            const imageUrl = dish?.querySelector("img").src;
            let regdate = "20230115";
            try {
              const extractDate = imageUrl
                ?.split("/")
                ?.at(-1)
                ?.replace("hosei_", "")
                ?.substring(0, 8);
              regdate = `${extractDate?.slice(0, 4)}-${extractDate?.slice(
                4,
                6
              )}-${extractDate?.slice(6)}`;
            } catch (err) {
              console.error("Date Format Error: ", err.message);
            }

            const obj = {
              category,
              sub,
              name,
              price: +price || 0,
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
      changeNameList,
      recommendList
    );

    await browser.close();

    const flatMenu = menu?.flat();

    const sortMenu = flatMenu.sort((a, b) => {
      if (a.recommendation > b.recommendation) {
        return -1;
      }

      const regDateA = new Date(a.regdate);
      const regDateB = new Date(b.regdate);

      if (regDateA.getTime() > regDateB.getTime()) {
        return -1;
      }
      if (regDateA.getTime() < regDateB.getTime()) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }

      return 0;
    });

    const completedMenu = sortMenu.map((dish, idx) => {
      return { id: idx + 1, ...dish };
    });

    const folderName = "JSON";
    const fileName = "menu.json";

    // メニューデータをjsonに保存
    try {
      fs.writeFileSync(
        __dirname + `\\${folderName}\\${fileName}`,
        JSON.stringify(completedMenu)
      );
      console.log("********** MENU DATA CREATION SUCCEEDED!!! **********");
    } catch (fserr) {
      console.error(err.message);
    }

    const imageUrl = completedMenu.map((dish) => {
      const { imageUrl } = dish;
      return imageUrl;
    });

    // イメージデータを返却
    return imageUrl;
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};

const downloadImage = async (imageUrlList) => {
  let errorCount = 0;
  let successCount = 0;
  // Ensure that the "image" directory exists
  const dir = path.join(__dirname, "image");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // Download each image and save it as a webp file in the "image" directory
  for (let i = 0; i < imageUrlList.length; i++) {
    const filename = `noriyan_dish_${i + 1}.webp`;
    const filepath = path.join(dir, filename);

    if (fs.existsSync(filepath)) {
      errorCount++;
      console.log(`File '${filepath}' already exists, skipping download.`);
      continue;
    }

    // It is synchronous but slow.
    // When switched to asynchronous, success/fail count cannot be counted.
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filepath);
      const request = https.get(imageUrlList[i], function (response) {
        response.pipe(file);
        response.on("end", resolve);
      });
      request.on("error", function (err) {
        console.error(
          `Error occurred while downloading '${imageUrlList[i]}': ${err.message}`
        );
        reject(err);
      });
      request.on("data", function (data) {
        successCount++;
      });

      request.end();
    })
      .then((resolve) => successCount++)
      .catch((err) => errorCount++);
  }

  return [successCount, errorCount];
};

(async function () {
  try {
    const menuImageUrlList = await getMenuImageUrlList();
    const [successCount, errorCount] = await downloadImage(menuImageUrlList);

    const files = fs.readdirSync(path.join(__dirname, "image"));
    console.log("Total number of Image files: ", files.length);
    console.log("Successful Downloads: ", successCount);
    console.log("Failed Downloads: ", errorCount);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
})();
