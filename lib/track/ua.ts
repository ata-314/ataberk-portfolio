// Link-preview fetchers, crawlers and headless scanners: never counted as visits.
const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|telegrambot|slackbot|slack-imgproxy|discordbot|skypeuripreview|linkedinbot|embedly|pinterestbot|vkshare|headless|phantom|lighthouse|pagespeed|google-read-aloud|mediapartners|proofpoint|mimecast|barracuda|python|curl|wget|go-http|java\//i;

export function isBot(ua: string) {
  return !ua || BOT.test(ua);
}

export function parseUa(ua: string) {
  const device = /ipad|tablet/i.test(ua) ? "Tablet" : /mobi|iphone|android/i.test(ua) ? "Telefon" : "Bilgisayar";
  const os = /iphone|ipad|ios/i.test(ua)
    ? "iOS"
    : /android/i.test(ua)
      ? "Android"
      : /mac os/i.test(ua)
        ? "macOS"
        : /windows/i.test(ua)
          ? "Windows"
          : /linux/i.test(ua)
            ? "Linux"
            : "Diğer";
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung"
        : /linkedinapp/i.test(ua)
          ? "LinkedIn"
          : /instagram/i.test(ua)
          ? "Instagram"
          : /fban|fbav/i.test(ua)
            ? "Facebook"
            : /chrome|crios/i.test(ua)
              ? "Chrome"
              : /firefox|fxios/i.test(ua)
                ? "Firefox"
                : /safari/i.test(ua)
                  ? "Safari"
                  : "Diğer";
  return { device, os, browser };
}
