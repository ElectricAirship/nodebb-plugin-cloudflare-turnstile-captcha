# nodebb-plugin-cloudflare-turnstile-captcha
A security captcha for using Cloudflare's Turnstile with NodeBB

# how to develop

## setup
1. create plugin git directory on same filesystem as the nodebb you're testing it on
2. add your in-development plugin to the nodebb's package.json with the direct file link method.  e.g., 
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
6. "Rebuild and restart" in the nodebb admin panel
7. `./nodebb log` in a console to watch the server side errors
8. test your changes
9. if not done, goto 5

