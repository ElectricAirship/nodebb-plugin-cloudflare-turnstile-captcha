<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->
	<div>
		<div class="alert alert-info mb-0 text-xs">
			<p>
				[[cloudflare-turnstile-captcha:admin-topic-start]]
				<a target="_blank" href="https://www.cloudflare.com/application-services/products/turnstile/">Cloudflare
					Turnstile CAPTCHA</a>
			</p>
			<p class="mb-0">
				[[cloudflare-turnstile-captcha:admin-topic-end]]
				<a target="_blank"
					href="https://github.com/ElectricAirship/nodebb-plugin-cloudflare-turnstile-captcha">cloudflare-turnstile-captcha</a>
			</p>
		</div>
	</div>

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
			<ul class="nav nav-tabs mb-3" role="tablist">
				<li role="presentation" class="nav-item"><a class="nav-link active" href="#recaptcha" aria-controls="recaptcha"
						role="tab" data-bs-toggle="tab">Cloudflare Turnstile</a></li>
			</ul>

			<form role="form" class="{nbbId}-settings">
				<fieldset>
					<div class="tab-content">
						<div role="tabpanel" class="tab-pane fade show active" id="recaptcha">
							<div class="row">
								<div class="col-sm-12">
									<div class="form-check">
										<input class="form-check-input"
											data-toggle-target="#turnstileSiteKey,#turnstileSecretKey,#loginTurnstileEnabled" type="checkbox"
											id="cloudflareTurnstileEnabled" name="cloudflareTurnstileEnabled" />
										<label class="form-check-label">[[cloudflare-turnstile-captcha:enable]] Cloudflare
											Turnstile</label>
									</div>
									<p class="form-text">
										[[cloudflare-turnstile-captcha:admin-get-key]]<a target="_blank"
											href="https://www.cloudflare.com/application-services/products/turnstile/">cloudflare.com/application-services/products/turnstile</a>
									</p>

									<div class="mb-3" style="width:45%;">
										<label for="turnstileSiteKey">Turnstile Site Key</label>
										<input placeholder="0x123456789" type="text" class="turnstileKey form-control" id="turnstileSiteKey"
											name="turnstileSiteKey" />
									</div>
									<div class="mb-3" style="width:45%;">
										<label for="turnstileSecretKey">Turnstile SECRET Key</label>
										<input placeholder="0xABCDEFABCDEF" type="text" class="turnstileKey form-control"
											id="turnstileSecretKey" name="turnstileSecretKey" />
									</div>

									<p class="form-text">
										[[cloudflare-turnstile-captcha:admin-privacy-reminder]]
									</p>
									<div class="form-check">
										<input class="form-check-input" type="checkbox" id="loginTurnstileEnabled"
											name="loginTurnstileEnabled" />
										<label class="form-check-label">[[cloudflare-turnstile-captcha:enable-turnstile-login]]</label>
									</div>
								</div>
							</div>
						</div>
					</div>
				</fieldset>
			</form>
		</div>
	</div>
</div>