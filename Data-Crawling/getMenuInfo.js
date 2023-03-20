import puppeteer from "puppeteer";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cloudImageUrl = "";

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
  "⑥シモネ": "シモネ・フェブル・シャブリ",
  "⑧ボルゴ": "ボルゴ・サンレオ・ビアンコ",
  カッシーナ: "カッシーナ・キッコ・ランゲ・ネッビオーロ",
  モンテスクラシックシリーズ:
    "モンテスクラシックシリーズ・カベルネソーヴィニヨン",
  タクンレセルヴ: "タクンレセルヴァ・カベルネ・ソーヴィニヨン",
  鳳凰美田: "【鳳凰美田】（初しぼり純米吟醸酒）",
  和牛ホルモンと春キャベツ味噌: "和牛ホルモンと春キャベツ味噌いため",
  セルがき一個: "セルがき一個（ポン酢、サルサ、ケチャップ、バジル）",
  焼きがき一個: "焼きがき一個（ガーリックバジル、醤油）",
  牡蠣ガーリックバジル焼き: "牡蠣ガーリックバジル焼きor醤油焼き（１個）",
  尾瀬の雪どけ: "尾瀬の雪どけ　純米大吟醸（群馬県）",
  竹の子しょうゆ焼き: "竹の子しょうゆ焼き又はわさび醤油",
  サルシッチャ: "サルシッチャ（バジルがきいた極太生ソーセージ）",
  黒毛和牛ロースステーキ: "黒毛和牛ロースステーキ（60〜70g）",
  前菜９品パレット: "前菜９品パレット（季節、しいれにより内容は変わります）",
};

const recommendList = [
  "帆立刺身",
  "金目鯛刺身",
  "サーモンカルパッチョ",
  "カニトースト（１枚）",
  "竹の子しょうゆ焼き又はわさび醤油",
  "金目鯛煮付け",
  "本日の刺身盛り合わせ（１名分）",
  "アボカドポテトサラダ",
  "ごぼうときゅうりのシャッキリサラダ",
  "ズワイガニクリームコロッケ（１個）",
  "明太クリームチーズ大根",
  "里芋のキッシュ",
  "するめいか焼き",
  "からすみ餅",
  "サルシッチャ（バジルがきいた極太生ソーセージ）",
  "けんとん豚とんぺい焼き",
  "地鶏ステーキ塩焼きこしょう",
  "地鶏ステーキジンジャーソース",
  "黒毛和牛コンビーフユッケ",
  "黒毛和牛ロースステーキ（60〜70g）",
  "まぐろと帆立のタルタル",
  "明太餅とろろねぎ焼き",
  "海鮮チヂミ",
  "りんごのピザ",
  "いかねぎ焼き",
  "豚ねぎ焼き",
  "グリーンカレー",
  "飛騨牛スープカレー（辛）",
  "本日のお浸し",
  "ナシゴレン（インドネシア炒飯）",
  "ミルクティーシャーベット",
  "締めパフェ",
  "生まぐろ刺身",
];

const getMenuImageUrlList = async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(
      "https://dining-menu.com/menu_system/sample_menu3/top.php?sc=215036&n=0&r=1Y"
    );

    // サブカテゴリーの抽出(
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
          // おすすめ
          let recommendation = 0;
          // サブカテゴリー
          const sub =
            categories && categories[idx].replaceAll(/[【】]|[\(].+/g, "");
          if (sub === "おすすめ") {
            recommendation = 1;
          }
          const dishes = Array.from(node.querySelectorAll("td > div"));
          const details = dishes.reduce((acc, dish) => {
            // メインカテゴリー
            let category = 0;
            const div = Array.from(dish.querySelectorAll("div"));
            const isDrink = drink?.some(
              (el) => categories && categories[idx].indexOf(el) > -1
            );
            if (isDrink) {
              category = 1;
            } else if (categories && categories[idx]?.includes(["デザート"])) {
              category = 2;
            }
            // 1: 売り切れ、0: 売り切れていない
            const status = div.length > 1 ? 1 : 0;
            const dishInfo = div.length > 1 ? div[1] : div[0];
            let name = dishInfo?.querySelector("p")?.textContent;
            // ...除去後、切り替え
            if (name?.includes("…")) {
              for (const [key, value] of Object.entries(changeNameList)) {
                if (name.includes(key)) {
                  name = value;
                  break;
                }
              }
            }
            // 【N】 除去
            if (name?.includes("【N】")) {
              name = name.replaceAll("【N】", "");
            }
            // 要約
            const description = "";
            // 値段
            const price = dishInfo
              ?.querySelector("span")
              ?.textContent.replace(/[^0-9]/g, "");
            // イメージURL
            const imageUrl = dish?.querySelector("img").src;
            let regdate = "20230115";
            try {
              // 日付抽出後、フォーマット(YYYY-MM-DD)
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

    // クーロリン終了
    await browser.close();

    const flatMenu = menu?.flat();

    // 人気メニュータグを追加
    const addRecommendMenu = flatMenu.map((dish) => {
      const { name } = dish;
      if (recommendList.indexOf(name) > -1) {
        dish.recommendation = 1;
      }

      return dish;
    });

    // サブメニューの情報を持ってくる
    const subArr = addRecommendMenu
      .reduce((acc, curr) => {
        const currCategory = curr["category"];
        if (!acc[currCategory]) {
          acc[currCategory] = [curr["sub"]];
          return acc;
        }

        if (acc[currCategory].includes(curr["sub"])) {
          return acc;
        }

        acc[currCategory].push(curr["sub"]);
        return [...(acc || [])];
      }, [])
      .flat();

    const sortMenu = subArr
      .reduce((acc, curr) => {
        const filterSubMenu = addRecommendMenu.filter((dish) => {
          return dish.sub === curr;
        });

        const sortFilterSubMenu = filterSubMenu.sort((a, b) => {
          // おすすめ順（１番）
          if (a.recommendation > b.recommendation) {
            return -1;
          }
          if (a.recommendation < b.recommendation) {
            return 1;
          }

          // 新着日付順（2番）
          const regDateA = new Date(a.regdate);
          const regDateB = new Date(b.regdate);

          if (regDateA.getTime() > regDateB.getTime()) {
            return -1;
          }
          if (regDateA.getTime() < regDateB.getTime()) {
            return 1;
          }

          // 料理の名前昇順（あ～ん、３番）
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }

          return 0;
        });
        return [...(acc || []), sortFilterSubMenu];
      }, [])
      .flat();

    // [おすすめ、季節物、(サブカテゴリの昇順で整列)]
    // const sortSubMenu = addRecommendMenu.sort((a, b) => {
    //   if (a.sub === "おすすめ" && b.sub === "季節物") {
    //     return -1;
    //   } else if (a.sub === "季節物") {
    //     return -1;
    //   } else if (b.sub === "おすすめ") {
    //     return 1;
    //   } else {
    //     if (a.sub < b.sub) {
    //       return -1;
    //     } else if (a.sub > b.sub) {
    //       return 1;
    //     } else {
    //       return 0;
    //     }
    //   }
    // });

    // ID追加
    const menuWithId = sortMenu.map((dish, idx) => {
      return {
        id: idx + 1,
        ...dish,
      };
    });

    // イメージURLの切り替え（クラウドのイメージ番号）
    const completedMenu = menuWithId.map((dish, idx) => {
      return {
        // ...dish,
        // imageUrl: `https://norisang-project.s3.ap-northeast-1.amazonaws.com/menu/noriyan_dish_${
        //   idx + 1
        // }.webp`,
        ...dish,
      };
    });

    const folderName = "JSON";
    const fileName = "menu.json";

    const originImageUrl = menuWithId.map((dish) => {
      const { imageUrl } = dish;
      return imageUrl;
    });

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

    // イメージデータを返却
    return originImageUrl;
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};

// イメージをダウンロード
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
    const file = fs.createWriteStream(filepath);
    const request = https.get(imageUrlList[i], function (response) {
      response.pipe(file);
    });
    request.on("error", function (err) {
      console.error(
        `Error occurred while downloading '${imageUrlList[i]}': ${err.message}`
      );
    });
    request.on("data", function (data) {
      successCount++;
    });

    request.end();
  }

  return [successCount, errorCount];
};

(async function () {
  try {
    const menuImageUrlList = await getMenuImageUrlList();
    await downloadImage(menuImageUrlList);

    const files = fs.readdirSync(path.join(__dirname, "image"));
    console.log("Total number of Image files: ", files.length);
    // console.log("Successful Downloads: ", successCount);
    // console.log("Failed Downloads: ", errorCount);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
})();
