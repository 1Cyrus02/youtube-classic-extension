class CookieStore {
  constructor(cookieString) {
    this.cookies = {};
    (cookieString || "").split(";").forEach((cookie) => {
      let [name, value] = cookie.split("=");
      name = (name || "").trim();
      if (name) {
        this.cookies[name] = (value || "").trim();
      }
    });
  }

  getItem(name) {
    return this.cookies[name] || null;
  }

  setItem(name, value) {
    this.cookies[name] = value;
  }

  removeItem(name) {
    delete this.cookies[name];
  }

  stringify() {
    return Object.keys(this.cookies)
      .map((key) => `${key}=${this.cookies[key]}`)
      .join("; ");
  }
}