import * as TextSanitizer from "./public-api.js";

if (typeof window !== "undefined") {
  window.TextSanitizer = TextSanitizer;
}
