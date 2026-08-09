# Bubble Test Bridge V1.0.21

## Endpoints
- Login: `https://almeshkat.mgtech.online/version-test/api/1.1/wf/guidance_login_test`
- Bootstrap: `https://almeshkat.mgtech.online/version-test/api/1.1/wf/guidance_bootstrap`
- Data API: `https://almeshkat.mgtech.online/version-test/api/1.1/obj`

## Test flow
1. Open the platform on GitHub Pages.
2. The test login screen appears if the browser session has no Bubble user token.
3. Sign in with an existing Bubble app user.
4. The token is stored only in `sessionStorage`.
5. The page reloads and `guidance_bootstrap` is called with `Authorization: Bearer <user token>`.
6. The platform receives that user's schools, departments, grades, students, academic years and terms according to the Bubble workflow and Privacy Rules.

## Security
- No admin token is used.
- Password is not stored.
- This test bridge uses Bubble `version-test`; switch to live only after validation.
- The public `guidance_login_test` endpoint is for testing and should be removed/replaced by the final Bubble launch bridge after testing.
