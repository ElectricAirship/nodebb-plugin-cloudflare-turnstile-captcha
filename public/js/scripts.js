"use strict";

/* global grecaptcha */

$(function () {
  var pluginName = "cloudflare-turnstile-captcha";

  function ensureCloudflareTurnstileCaptchaThenCreate() {
    if (
      !$('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]').length
    ) {
      injectScript(
        "//challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
      );
    }
  }

  window.onloadTurnstileCallback = function () {
    turnstile.render("#example-container", {
      sitekey: "SITEKEY HERE",
      callback: function (token) {
        console.log(`Challenge Success ${token}`);
      },
    });
  };

  function onRegisterPage() {
    if (ajaxify.data.cloudflareTurnstileArgs) {
      ensureCloudflareTurnstileCaptchaThenCreate();
    }
  }

  function onLoginPage() {
    if (
      ajaxify.data.cloudflareTurnstileArgs &&
      ajaxify.data.cloudflareTurnstileArgs.addLoginRecaptcha
    ) {
      ensureCloudflareTurnstileCaptchaThenCreate();
    }
  }

  function injectTag(tagName, attrs, options) {
    options = options || {};

    var tag = document.createElement(tagName);
    tag.onload = options.onload || null; // @ie8; img.onload cannot be undefined

    var setAttr = tag.setAttribute
      ? function (tag, key, value) {
          tag.setAttribute(key, value);
          return tag;
        }
      : function (tag, key, value) {
          tag[key] = value;
          return tag;
        };

    Object.keys(attrs).forEach(function (key) {
      tag = setAttr(tag, key, attrs[key]);
    });

    if (options.insertBefore) {
      options.insertBefore.parentNode.insertBefore(tag, options.insertBefore);
    } else if (options.appendChild) {
      options.appendChild.appendChild(tag);
    } else {
      var scripts = document.getElementsByTagName("script");
      scripts[scripts.length - 1].parentNode.appendChild(tag);
    }
  }

  function injectScript(src, options) {
    options = options || {};
    injectTag(
      "script",
      { src: src, type: "text/javascript", async: "", defer: "" },
      options
    );
  }

  $(window).on("action:ajaxify.end", function (evt, data) {
    switch (data.tpl_url) {
      case "register":
        onRegisterPage(data);
        break;
      case "login":
        onLoginPage(data);
        break;
      case "account/profile":
        onAccountProfilePage(data);
        break;
      case "admin/manage/registration":
        onManageRegistrationPage(data);
        break;
    }
  });
});

window.__nodebbCloudflareTurnstileCaptcha__ = function () {
  var args = ajaxify.data.cloudflareTurnstileArgs;
  alert("hello from __nodebbCloudflareTurnstileCaptcha__ - go check the args");
  if (!args) {
    return;
  }
};

$(window).on("action:script.load", function (evt, data) {
  // Inject register.tpl client-side script
  if (["register", "login"].includes(data.tpl_url)) {
    // data.scripts.push("cloudflare-turnstile-captcha/hcaptcha");
    alert(`register?  login?  we don't need hcaptcha...`);
  }
});
