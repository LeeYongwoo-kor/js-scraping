import puppeteer from "puppeteer";

const main = async () => {
  let browser = await puppeteer.launch({ headless: true });
  // 브라우저 띄우기
  let page = await browser.newPage();
  // 페이지 띄우기
  await page.goto("http://corners.gmarket.co.kr/Superdeals");
  let ehList = await page.$$("li.masonry-brick"); // element 접근
  // $ -> querySelector, $$ -> querySelectorAll
  for (let eh of ehList) {
    let title = await eh.$eval("span.title", (el) => el.innerText);
    let price = await eh.$eval("span.price strong", (el) => el.innerText);
    console.log(title, price);
  }

  browser.close();
};

main();
