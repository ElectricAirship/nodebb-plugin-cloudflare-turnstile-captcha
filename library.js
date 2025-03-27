"use strict";

const https = require("https");

const winston = require.main.require("winston");
const nconf = require.main.require("nconf");
const Meta = require.main.require("./src/meta");
const User = require.main.require("./src/user");
const Topics = require.main.require("./src/topics");
const db = require.main.require("./src/database");

const pluginData = require("./plugin.json");

const Plugin = module.exports;

pluginData.nbbId = pluginData.id.replace(/nodebb-plugin-/, "");
Plugin.nbbId = pluginData.nbbId;

let cloudflareTurnstileArgs = {};
let pluginSettings = {}; // Add this line to declare pluginSettings

Plugin.middleware = {};

Plugin.middleware.isAdminOrGlobalMod = function (req, res, next) {
  User.isAdminOrGlobalMod(req.uid, (err, isAdminOrGlobalMod) => {
    if (err) {
      return next(err);
    }
    if (isAdminOrGlobalMod) {
      return next();
    }
    res
      .status(401)
      .json({ message: "[[cloudflare-turnstile-captcha:not-allowed]]" });
  });
};

Plugin.middleware.cloudflareTurnstileCaptcha = function (req, res, next) {
  if (!pluginSettings.cloudflareTurnstileEnabled) {
    return res
      .status(400)
      .send({ message: "[[cloudflare-turnstile-captcha:not-enabled]]" });
  }

  if (!pluginSettings.turnstileSiteKey) {
    return res.status(400).send({
      message: "[[cloudflare-turnstile-captcha:sfs-api-key-not-set]]",
    });
  }
  next();
};

Plugin.load = async function (params) {
  const settings = await Meta.settings.get(pluginData.nbbId);

  if (!settings) {
    winston.warn(
      `[plugins/${pluginData.nbbId}] Settings not set or could not be retrieved!`
    );
    return;
  }

  if (settings.cloudflareTurnstileEnabled === "on") {
    if (settings.turnstileSiteKey && settings.turnstileSecretKey) {
      cloudflareTurnstileArgs = {
        addLoginRecaptcha: settings.loginTurnstileEnabled === "on",
        publicKey: settings.turnstileSiteKey,
        targetId: `${pluginData.nbbId}-recaptcha-target`,
        options: {
          theme: "clean",
          hl: (Meta.config.defaultLang || "en").toLowerCase(),
          tabindex: settings.recaptchaTabindex || 0,
        },
      };
    }
  }

  pluginSettings = settings;

  const routeHelpers = require.main.require("./src/routes/helpers");
  routeHelpers.setupAdminPageRoute(
    params.router,
    `/admin/plugins/${pluginData.nbbId}`,
    renderAdmin
  );

  // Add the missing handlers for these routes
  params.router.post(
    `/api/user/:userslug/${pluginData.nbbId}/report`,
    [
      Plugin.middleware.isAdminOrGlobalMod,
      Plugin.middleware.cloudflareTurnstileCaptcha,
    ],
    async (req, res) => {
      try {
        // Implement your report handling logic here
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  params.router.post(
    `/api/user/:username/${pluginData.nbbId}/report/queue`,
    [
      Plugin.middleware.isAdminOrGlobalMod,
      Plugin.middleware.cloudflareTurnstileCaptcha,
    ],
    async (req, res) => {
      try {
        // Implement your report queue handling logic here
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
  );
};

async function renderAdmin(req, res) {
  let akismet = await db.getObject(`${pluginData.nbbId}:akismet`);

  res.render(`admin/plugins/${pluginData.nbbId}`, {
    nbbId: pluginData.nbbId,
    title: "Cloudflare Turnstile Captcha",
  });
}

// called when you hit ANY admin page
Plugin.appendConfig = async (data) => {
  data["cloudflare-turnstile-captcha"] = {};
  const { cloudflareTurnstileEnabled, turnstileSiteKey } =
    await Meta.settings.get("cloudflare-turnstile-captcha");

  if (cloudflareTurnstileEnabled === "on") {
    data["cloudflare-turnstile-captcha"].turnstileSiteKey = {
      key: turnstileSiteKey,
    };
  }

  return data;
};

// called when you hit the public register/login page and... add the captcha!
Plugin.addCaptcha = async (data) => {
  function addCaptchaData(templateData, loginCaptchaEnabled, captcha) {
    if (templateData.regFormEntry && Array.isArray(templateData.regFormEntry)) {
      templateData.regFormEntry.push(captcha);
    } else if (Array.isArray(templateData.loginFormEntry)) {
      if (loginCaptchaEnabled) {
        templateData.loginFormEntry.push(captcha);
      }
    } else {
      templateData.captcha = captcha;
    }
  }

  if (cloudflareTurnstileArgs) {
    if (data.templateData) {
      data.templateData.cloudflareTurnstileArgs = cloudflareTurnstileArgs;
      addCaptchaData(
        data.templateData,
        cloudflareTurnstileArgs.addLoginRecaptcha,
        {
          label: "Captcha",
          html: `<div id="${pluginData.nbbId}-recaptcha-target"></div>`,
          styleName: pluginData.nbbId,
        }
      );
    }
  }

  const { cloudflareTurnstileEnabled, logincloudflareTurnstileEnabled } =
    await Meta.settings.get("cloudflare-turnstile-captcha");

  if (cloudflareTurnstileEnabled === "on") {
    if (data.templateData) {
      addCaptchaData(
        data.templateData,
        logincloudflareTurnstileEnabled === "on",
        {
          label: "CAPTCHA",
          html: `<div id="h-captcha"></div>`,
          styleName: pluginData.nbbId,
        }
      );
    }
  }

  return data;
};

Plugin.checkRegister = async function (data) {
  await Promise.all([
    Plugin._cloudflareTurnstileCheck(data.req, data.userData),
  ]);
  return data;
};

Plugin.checkLogin = async function (data) {
  const { logincloudflareTurnstileEnabled } = await Meta.settings.get(
    "cloudflare-turnstile-captcha"
  );
  if (logincloudflareTurnstileEnabled === "on") {
    await Plugin._cloudflareTurnstileCheck(data.userData);
  }

  return data;
};

Plugin._cloudflareTurnstileCheck = async (userData) => {
  // all this needs to be replaced
  const { cloudflareTurnstileEnabled, turnstileSecretKey } =
    await Meta.settings.get("cloudflare-turnstile-captcha");

  if (cloudflareTurnstileEnabled !== "on") {
    return;
  }

  // const response = await hCaptcha.verify(
  //   hCaptchaSecretKey,
  //   userData["cf-turnstile-response"]
  // );

  async function heyTurnstile() {
    return new Promise((resolve, reject) => {
      const data = new URLSearchParams({
        secret: turnstileSecretKey,
        response: userData.body["cf-turnstile-response"],
        remoteip: userData.ip,
      });

      const options = {
        hostname: "challenges.cloudflare.com",
        path: "/turnstile/v0/siteverify",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            const result = JSON.parse(responseData);

            if (!result.success) {
              reject(
                new Error(
                  "[[cloudflare-turnstile-captcha:captcha-not-verified]]"
                )
              );
            }
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.write(data.toString());
      req.end();
    });
  }

  const response = await heyTurnstile();

  if (!response.success) {
    throw new Error("[[cloudflare-turnstile-captcha:captcha-not-verified]]");
  }
};

Plugin.admin = {
  menu: function (custom_header, callback) {
    custom_header.plugins.push({
      route: `/plugins/${pluginData.nbbId}`,
      icon: pluginData.faIcon,
      name: pluginData.name,
    });
    callback(null, custom_header);
  },
};
