"use strict";

$(function () {
  var pluginName = "cloudflare-turnstile-captcha";

  function ensureCloudflareTurnstileCaptchaThenCreate() {
    if (
      !$('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]').length
    ) {
      injectScript(
        "//challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
      );
    } else {
      renderWidget();
    }
  }

  function renderWidget() {
    if (
      ajaxify.data.cloudflareTurnstileArgs &&
      ajaxify.data.cloudflareTurnstileArgs.featureOn
    ) {
      turnstile.render(`#${ajaxify.data.cloudflareTurnstileArgs.targetId}`, {
        sitekey: ajaxify.data.cloudflareTurnstileArgs.publicKey,
        callback: function (token) {
          console.log("token", token);
        },
      });
    }
  }

  window.onloadTurnstileCallback = function () {
    renderWidget();
  };

  function onRegisterPage() {
    if (
      ajaxify.data.cloudflareTurnstileArgs &&
      ajaxify.data.cloudflareTurnstileArgs.featureOn
    ) {
      ensureCloudflareTurnstileCaptchaThenCreate();
    }
  }

  function onLoginPage() {
    if (
      ajaxify.data.cloudflareTurnstileArgs &&
      ajaxify.data.cloudflareTurnstileArgs.featureOn &&
      ajaxify.data.cloudflareTurnstileArgs.enableOnLoginPage
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
    }
  });
});
