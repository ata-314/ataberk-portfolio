// Tells Bing, Yandex and the other IndexNow engines about every URL in the live
// sitemap (Bing's index also feeds ChatGPT search). Run after a production deploy:
//   node scripts/indexnow.mjs
// The key is public by design: IndexNow checks it at https://www.ataberksoylu.com/<key>.txt.
const KEY = "d2cbf80537db0520716a92c789ae8732";
const HOST = "www.ataberksoylu.com";

const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} URLs → ${res.status} ${res.statusText}`);
