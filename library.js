"use strict";

const https = require("https");

const winston = require.main.require("winston");
const Meta = require.main.require("./src/meta");
const User = require.main.require("./src/user");
const db = require.main.require("./src/database");

const pluginData = require("./plugin.json");

const Plugin = module.exports;

function grueServerLog(data, title) {
  // console.log(`grueServerLog ${title}`, data);
}
function grueFileLog(jsonObject, title) {
  /*
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `../nodebb-plugin-cloudflare-turnstile-captcha/logs/grue-${timestamp}.json`;

  // Handle circular references during stringify
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular Reference]";
        }
        seen.add(value);
      }
      return value;
    };
  };

  if (jsonObject) {
    grueServerLog(filename, `grueFileLog - writing ${title}`);
  } else {
    grueServerLog(null, `grueFileLog - was passed NULL data for ${title}`);
    return;
  }

  try {
    const fs = require("fs");
    const jsonString = JSON.stringify(jsonObject, getCircularReplacer(), 2);
    fs.writeFileSync(filename, jsonString, "utf8");

    return filename;
  } catch (err) {
    console.error("Failed to write log file:", err);
    return null;
  }
	*/
}

pluginData.nbbId = "cloudflare-turnstile-captcha";
Plugin.nbbId = pluginData.nbbId;

let cloudflareTurnstileArgs = { featureOn: false };
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

// Only for plugin development iteration
Plugin.onReboot = async function (params) {
  // https
  //   .request(
  //     "https://071a-146-70-195-88.ngrok-free.app/SOUND-FROG-FORUM-ELAIR",
  //     {
  //       method: "GET",
  //     },
  //     (res) => {
  //       res.on("data", (chunk) => {
  //         // console.log(`BODY: ${chunk}`);
  //       });
  //       res.on("end", () => {
  //         // console.log("No more data in response.");
  //       });
  //     }
  //   )
  //   .on("error", (err) => {
  //     console.error(err);
  //   })
  //   .end();
};

Plugin.load = async function (params) {
  const settings = await Meta.settings.get(pluginData.nbbId);

  if (!settings) {
    winston.warn(
      `[plugins/cloudflare-turnstile-captcha] Settings not set or could not be retrieved!`
    );
    return;
  }

  if (settings.cloudflareTurnstileEnabled === "on") {
    if (settings.turnstileSiteKey && settings.turnstileSecretKey) {
      cloudflareTurnstileArgs = {
        featureOn: true,
        enableOnLoginPage: settings.loginTurnstileEnabled === "on",
        publicKey: settings.turnstileSiteKey,
        // The original did stringbuilding
        // 1. stringbuilding is dumb if other things that reference it arent stringbuilt
        // 2. stringbuilding is bad because it breaks grepability
        targetId: `cloudflare-turnstile-captcha-recaptcha-target`,
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
    `/admin/plugins/cloudflare-turnstile-captcha`,
    renderAdmin
  );

  // Add the missing handlers for these routes
  params.router.post(
    `/api/user/:userslug/cloudflare-turnstile-captcha/report`,
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
    `/api/user/:username/cloudflare-turnstile-captcha/report/queue`,
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
  let akismet = await db.getObject(`cloudflare-turnstile-captcha:akismet`);

  res.render(`admin/plugins/cloudflare-turnstile-captcha`, {
    nbbId: "cloudflare-turnstile-captcha",
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

  if (cloudflareTurnstileArgs && cloudflareTurnstileArgs.featureOn) {
    if (data.templateData) {
      data.templateData.cloudflareTurnstileArgs = cloudflareTurnstileArgs;
      addCaptchaData(
        data.templateData,
        cloudflareTurnstileArgs.enableOnLoginPage,
        {
          label: "Cloudflare Turnstile Captcha",
          html: `<div id="cloudflare-turnstile-captcha-recaptcha-target"></div>`,
          styleName: "cloudflare-turnstile-captcha",
        }
      );
    }
  }

  return data;
};

Plugin.checkRegister = async function (data) {
  // await Promise.all([Plugin._cloudflareTurnstileCheck(data.req, "register")]);
  await Plugin._cloudflareTurnstileCheck(data.userData, "register");
  return data;
};

Plugin.checkLogin = async function (data) {
  const settings = await Meta.settings.get("cloudflare-turnstile-captcha");
  const isLoginEnabled = settings.loginTurnstileEnabled === "on";

  if (isLoginEnabled) {
    await Plugin._cloudflareTurnstileCheck(data.userData, "login");
  }

  return data;
};

Plugin._cloudflareTurnstileCheck = async (cfData, where) => {
  grueFileLog(cfData, `Plugin._cloudflareTurnstileCheck - ${where}`);
  const { cloudflareTurnstileEnabled, turnstileSecretKey } =
    await Meta.settings.get("cloudflare-turnstile-captcha");

  grueServerLog(cloudflareTurnstileEnabled, `cloudflareTurnstileEnabled`);

  if (cloudflareTurnstileEnabled !== "on") {
    return;
  }

  async function heyTurnstile() {
    grueServerLog(null, `about to call turnstyle`);
    return new Promise((resolve, reject) => {
      const data = new URLSearchParams({
        secret: turnstileSecretKey,
        response: cfData["cf-turnstile-response"],
        remoteip: cfData.ip,
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
          grueServerLog(null, `ts - onData`);
          responseData += chunk;
        });

        res.on("end", () => {
          grueServerLog(null, `ts - onEnd`);
          try {
            const result = JSON.parse(responseData);

            if (!result.success) {
              grueServerLog(result, `ts - noSuccess`);
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
        grueServerLog(err, `ts - onError`);
        reject(err);
      });

      req.write(data.toString());
      req.end();
    });
  }

  const response = await heyTurnstile();
  grueServerLog(response, `turnstyle said...`);

  if (!response.success) {
    throw new Error("[[cloudflare-turnstile-captcha:captcha-not-verified]]");
  }
};

Plugin.admin = {
  menu: function (custom_header, callback) {
    custom_header.plugins.push({
      route: `/plugins/cloudflare-turnstile-captcha`,
      icon: pluginData.faIcon,
      name: pluginData.name,
    });
    callback(null, custom_header);
  },
};
