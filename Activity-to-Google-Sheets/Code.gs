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
 * The URL it gives you after you deploy this webapp (the Deploy button in the upper-right)
 * This will be stored in your Habitica user API data, and is where Habitica sends the requested data
 */
const WEB_APP_URL = "WebAppURL"

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
/* [Users] Do not edit code below this line   */
/* ========================================== */
const AUTHOR_ID = "fd200d06-beb0-46fd-b42f-81924c037574"
const SCRIPT_NAME = "Task Activity to Google Sheets"
const HEADERS = {
  "x-client" : AUTHOR_ID + " - " + SCRIPT_NAME,
  "x-api-user" : USER_ID,
  "x-api-key" : API_TOKEN,
}

function doOneTimeSetup() {
  // Next, create the webhook
  const options = {
    "scored" : true,
  }
  const payload = {
    "url" : WEB_APP_URL,
    "label" : SCRIPT_NAME + " Webhook",
    "type" : "taskActivity",
    "options" : options,
  }
  apiMult_createNewWebhookNoDuplicates(payload)
}

// do things when the webhook runs
function doPost(e) {
  // const dataContents = JSON.parse(e.postData.contents)
  // const type = dataContents.type
  // const task = dataContents.task

  task = { "alias": "test" }
  type = "scored"
  
  // Sanitize task alias
  let sanitizedAlias = "sanitized" // This will be the value if undefined, null, or blank
  if ( (task.alias != undefined) && (task.alias != null) && (task.alias != "") ) {
    sanitizedAlias = task.alias
  }
  
  if (type == "scored") {
    // Format data for inserting into the spreadsheet
    // TODO - This is a test
    var spreadsheetPayload = [[type, sanitizedAlias]]

    // Put data in the spreadsheet
    appendValues(SPREADSHEET_ID, SHEET_NAME, spreadsheetPayload, "RAW")
  }
  return HtmlService.createHtmlOutput()
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

// Create a webhook if no duplicate exists
function apiMult_createNewWebhookNoDuplicates(payload) {
  const response = api_getWebhooks()
  const webhooks = JSON.parse(response).data
  var duplicateExists = 0
    
  for (var i in webhooks) {
    if (webhooks[i].label == payload.label) {
      duplicateExists = 1;
    }
  }
  // If webhook to be created doesn't exist yet
  if (!duplicateExists) {
    api_createNewWebhook(payload)
  }
}

// Used to see existing webhooks, and therefore if there's a duplicate
function api_getWebhooks() {
  const params = {
    "method" : "get",
    "headers" : HEADERS,
    "muteHttpExceptions" : true,
  }
  
  const url = "https://habitica.com/api/v3/user/webhook"
  return UrlFetchApp.fetch(url, params)
}

// Creates a webhook (as part of the "don't make it if there's a duplicate" function)
function api_createNewWebhook(payload) {
  const params = {
    "method" : "post",
    "headers" : HEADERS,
    "contentType" : "application/json",
    "payload" : JSON.stringify(payload),
    "muteHttpExceptions" : true,
  }
   
  const url = "https://habitica.com/api/v3/user/webhook"
  return UrlFetchApp.fetch(url, params)
}

// Gets user info so I can use it, especially stats like mana, experience, and level
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
