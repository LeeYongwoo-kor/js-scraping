import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const __dirname = "JSON";

const getOneYear = (currentDate) => {
  let oneYear = [];
  let year = Number(currentDate.slice(0, 4));
  let month = Number(currentDate.slice(-2));

  for (let i = 0; i < 12; i++) {
    let yyyymm = "".concat(year, ("0" + month).slice(-2));
    oneYear = [...(oneYear || []), yyyymm];
    month--;
    if (!month) {
      year--;
      month = 12;
    }
  }

  return oneYear;
};

const getDate = () => {
  const date = new Date();
  const yyyymm = +date.getFullYear() + ("0" + date.getMonth + 1).slice(-2);
  return yyyymm;
};

const getLoto6Info = async (yyyymm) => {
  const loto6Info = {};
  const browser = await puppeteer.launch({ headless: true });
  try {
    if (!browser.isConnected) throw new Error("Connection Failure");
    const page = await browser.newPage();

    await page.goto(
      `https://takarakuji.rakuten.co.jp/backnumber/loto6/${yyyymm}`
    );
    if (!browser.isConnected) return "Not Connect";
    const loto6List = await page.$$("table.tblType02");

    for (const loto of loto6List) {
      const round = await loto.$eval("th[colspan='6']", (el) => el.textContent);
      const announceDate = await loto.$eval(
        "td[colspan='6'",
        (el) => el.textContent
      );
      const numbers = await loto.$$eval("span.loto-font-large", (el) =>
        el.map((option) => parseInt(option.textContent) || option.textContent)
      );
      const prize = await loto.$$eval("td.txtRight", (el) =>
        el.map((option) =>
          option.textContent !== "該当なし" ? option.textContent : "Nobody Wins"
        )
      );
      const prizeObj = prize.reduce((acc, curr, idx, arr) => {
        if (idx !== arr.length - 1) {
          idx % 2 === 0
            ? (acc[arr[idx]] = 0)
            : (acc[arr[idx - 1]] = parseInt(curr.replace(/,/g, "")) || curr);
        }
        return acc;
      }, {});
      const roundNum = round.match(/\d{4}/g).toString();
      loto6Info[roundNum] = {};
      loto6Info[roundNum]["round"] = round;
      loto6Info[roundNum]["announceDate"] = announceDate;
      loto6Info[roundNum]["winning"] = numbers.slice(0, numbers.length - 1);
      loto6Info[roundNum]["bonus"] =
        parseInt(numbers[numbers.length - 1].replace(/[^0-9]/g, "")) ||
        numbers[numbers.length - 1].replace(/[^0-9]/g, "");
      loto6Info[roundNum]["prize"] = prizeObj;
      loto6Info[roundNum]["carryOver"] =
        parseInt(prize[prize.length - 1].replace(/,/g, "")) ||
        prize[prize.length - 1];
    }
  } catch (e) {
    console.log(e);
  } finally {
    browser.close();
  }

  return loto6Info;
};

const getLoto6InfoOneYear = async () => {
  const promises = [];
  const currentDate = getDate();
  const oneYear = getOneYear(currentDate);

  for (let yyyymm of oneYear) {
    promises.push(getLoto6Info(yyyymm));
  }

  Promise.all(promises)
    .then((res) => {
      const lotoObj = JSON.stringify(res);
      fs.writeFile(`../${__dirname}/loto6.json`, lotoObj, (err, result) => {
        if (err) console.log("Error!!", err);
        if (result) console.log("File saved successfully!! よっしゃー!");
      });
    })
    .catch((e) => console.log(e));
};

console.time("Time: ");
getLoto6InfoOneYear();
console.timeEnd("Time: ");
