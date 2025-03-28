# nodebb-plugin-cloudflare-turnstile-captcha

A security captcha for using Cloudflare's Turnstile with NodeBB

# how to develop

## setup

1. create plugin git directory on same filesystem as the nodebb you're testing it on
2. add your in-development plugin to the nodebb's package.json with the direct file link method. e.g.,

```js
		"something-else": "7.0.32",
		"nodebb-plugin-cloudflare-turnstile-captcha": "file:../nodebb-plugin-cloudflare-turnstile-captcha",
		"another-thing": "6.9.16",
```

3. `npm i` your nodebb
4. enable the plugin in the nodebb admin section

## iteration loop

5. make your changes to your plugin
6. `rm -rf  /path/to/nodebb/node_modules/nodebb-plugin-cloudflare-turnstile-captcha`
7. `npm i` your nodebb (and wait until done)
8. "Rebuild and restart" in the nodebb admin panel
9. `./nodebb log` in a console to watch the server side errors
10. test your changes
11. if not done, goto 5

## TODO

- [x] Registration verification
- [ ] Login verification
- [ ] Admin page review
- - [ ] toggle on/off
- - [ ] review all i18n strings

----- and then again for final pass

- [ ] Registration verification
- [ ] Login verification
- [ ] Admin page review
- - [ ] toggle on/off
- - [ ] review all i18n strings
- [ ] remove all debugging statments `grueServerLog` and `grueClientLog`
