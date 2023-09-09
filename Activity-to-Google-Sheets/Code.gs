// This code is licensed under the same terms as Habitica:
  // https://raw.githubusercontent.com/HabitRPG/habitrpg/develop/LICENSE

/* ========================================== */
/* [Users] Required script data to fill in    */
/* ========================================== */

/**
 * Your user ID found at https://habitica.com/user/settings/api
 */
const USER_ID = "UserID"

/**
 * Your API token found at https://habitica.com/user/settings/api
 * Click "Show API Token" to view
 * DO NOT SHARE THIS WITH ANYONE! Treat it like a password to your account
 */
const API_TOKEN = "APIToken"

/**
 * After you deploy this webapp (the Deploy button in the upper-right), the URL it gives you
 * This will be stored in your Habitica user API data, and is where Habitica sends the requested data
 */
const WEB_APP_URL = "WebAPPUrl"

/* ========================================== */
/* [Users] Required customizations to fill in */
/* ========================================== */

/**
 * The unique ID for the spreadsheet
 * When you edit a spreadsheet, the url looks like:
 * https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/edit#gid=01234567890
 * Where the x's are is the unique ID for your sheet
 * 
 * Make sure to enable the "Sheets" service in the menu to the left
 */
const SPREADSHEET_ID = "SpreadsheetID"

/**
 * The sheet name in your spreadsheet you want to append values to
 * Found in the bottom tabs when you open your spreadsheet
 * If you just created a sheet, the only one there will be named Sheet1 (or whatever sheet is in your language)
 */
const SHEET_NAME = "Sheet1"

/* ========================================== */
/* [Users] Optional customizations to fill in */
/* ========================================== */

// TODO - Add stuff to let the user change what values go in the spreadsheet

/* ========================================== */
/* [Users] Do not edit code below this        */
/* ========================================== */

const AUTHOR_ID = "fd200d06-beb0-46fd-b42f-81924c037574"
const SCRIPT_NAME = "Task Activity to Google Sheets"
const HEADERS = {
  "x-client" : AUTHOR_ID + " - " + SCRIPT_NAME,
  "x-api-user" : USER_ID,
  "x-api-key" : API_TOKEN,
}

/**
 * Creates the webhook if it doesn't already exist
 */
function doOneTimeSetup() {
  // Ensure the webhook doesn't already exist
  var requestCurrentWebhooksParams = {
    "method" : "get",
    "headers" : HEADERS,
    "muteHttpExceptions" : true,
  }

  currentWebhooks = UrlFetchApp.fetch("https://habitica.com/api/v3/user/webhook", requestCurrentWebhooksParams)

  var isDuplicate = false
  for (var i in currentWebhooks) {
    if (currentWebhooks[i].label == newWebhookPayload.label) {
      isDuplicate = true
    }
  }

  // Create new webhook
  var newWebhookPayload = {
    "url" : WEB_APP_URL,
    "label" : SCRIPT_NAME + " Webhook",
    "type" : "taskActivity",
    "options" : {
      "created": false,
      "updated": false,
      "deleted": false,
      "scored" : true
    }
  }

  const newWebhookParams = {
    "method" : "post",
    "headers" : HEADERS,
    "contentType" : "application/json",
    "payload" : JSON.stringify(newWebhookPayload),
    "muteHttpExceptions" : true,
  }

  if ( !isDuplicate ) {
    UrlFetchApp.fetch("https://habitica.com/api/v3/user/webhook", newWebhookParams)
  }
}

/**
 * Do things when the webhook runs
 */
function doPost(e) {
  // var dataContents = JSON.parse(e.postData.contents)

  // TODO - This is a test
  var dataContents = {
    task: "task",
    type: "scored"
  }

  // Get additional data that the user might want in the spreadsheet
  // TODO - Let the user customize what goes in the sheet
  const user = JSON.parse(api_getAuthenticatedUserProfile("stats"))
  const timestamp = Date.now()

  // Format data for inserting into the spreadsheet
  // TODO - This is a test
  var spreadsheetPayload = [[]]
  for ( let key in dataContents ) {
    spreadsheetPayload[0].push(dataContents[key])
  }

  // Put data in the spreadsheet
  appendValues(SPREADSHEET_ID, SHEET_NAME, spreadsheetPayload, "RAW")

  return HtmlService.createHtmlOutput()
}

/**
 * Gets user info such as cronCount, mana, experience, and level
 * @param {string} userFields what user data to request
 * @returns {*} requested user data
 */
function api_getAuthenticatedUserProfile(userFields) {
  const params = {
    "method" : "get",
    "headers" : HEADERS,
    "muteHttpExceptions" : true,
  }
  
  var url = "https://habitica.com/api/v3/user"
  if (userFields != "") {
    url += "?userFields=" + userFields
  }

  return UrlFetchApp.fetch(url, params)
}

/**
 * Appends values to the specified sheet
 * @param {string} spreadsheetId spreadsheet's ID
 * @param {string} sheetName sheet in the spreadsheet
 * @param {list<string>} values list of rows of values to input
 * @param valueInputOption determines how the input should be interpreted
 * @see
 * https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
 * @returns {*} spreadsheet with appended values
 */
function appendValues(spreadsheetId, sheetName, values, valueInputOption) {
  try {
    let valueRange = Sheets.newRowData()
    valueRange.values = values

    let appendRequest = Sheets.newAppendCellsRequest()
    appendRequest.sheetId = spreadsheetId
    appendRequest.rows = [valueRange]

    const result = Sheets.Spreadsheets.Values.append(valueRange, spreadsheetId, sheetName, {valueInputOption: valueInputOption})
    return result
  } catch (err) {
    // TODO (developer) - Handle exception
    console.log('Failed with error %s', err.message)
  }
}
