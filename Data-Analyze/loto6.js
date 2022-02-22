import { readFile } from "fs/promises";

const loto6Info = JSON.parse(await readFile("../JSON/loto6.json"));

for (const [key, value] of Object.entries(loto6Info)) {
  //   console.log(key, value);
  //   console.log(key.length);
}
for (const loto6 of loto6Info) {
  let count = 0;
  for (const [key, value] of Object.entries(loto6)) {
    count++;
  }
  console.log(count);
}
