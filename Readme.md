# [Puppeteer API](https://pptr.dev/api)

## Page.$(selector)

= **document.querySelector**

> Runs document.querySelector within the page. If no element matches the selector, the return value resolves to null.

---

## Page.$$(selector)

= **document.querySelectorAll**

> The method runs document.querySelectorAll within the page. If no elements match the selector, the return value resolves to [].

---

## Page.$eval(selector, pageFunction, args)

= **document.querySelector**

> This method runs document.querySelector within the page and passes the result as the first argument to the pageFunction.

```js
const searchValue = await page.$eval("#search", (el) => el.value);
const preloadHref = await page.$eval("link[rel=preload]", (el) => el.href);
const html = await page.$eval(".main-container", (el) => el.outerHTML);
```

---

## Page.$$eval(selector, pageFunction, args)

= **Array.from(document.querySelectorAll(selector))**

> This method runs Array.from(document.querySelectorAll(selector)) within the page and passes the result as the first argument to the pageFunction.

```js
// get the amount of divs on the page
const divCount = await page.$$eval("div", (divs) => divs.length);

// get the text content of all the `.options` elements:
const options = await page.$$eval("div > span.options", (options) => {
  return options.map((option) => option.textContent);
});
```

---
