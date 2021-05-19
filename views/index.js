import { CLIENT, OAUTH_PROVIDER, REDIRECT_URL } from './config.js';
import { generateState, readCookie } from './helpers.js';

document.getElementById("myButton").addEventListener("click", async () => {
  // GET OAUTH
  // response_type
  // client_id
  // redirect_url
  // scope
  // state

  // create a random state

  document.cookie = `sid=${generateState(30)}; max-age=3600;`;

  const requestUrl = `${OAUTH_PROVIDER}?response_type=code&client_id=${CLIENT.CLIENT_ID}&redirect_uri=${REDIRECT_URL}/oauth&scope=profile&state=${readCookie("sid")}`;

  window.location.href = requestUrl;

  fetch(requestUrl, { mode: "no-cors" });

});