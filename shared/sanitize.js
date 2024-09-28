export const sanitizeForHTML = (text) => {
    var $el = ui.make("div");
    $el.innerText = text;
    var sanitized = $el.innerHTML;
    $el.remove();
    return sanitized;
  },
  sanitizeForKey = (content) =>
    content.replace(/[\/.$#\[\]]|[\x00-\x1F\x7F]/g, "");
