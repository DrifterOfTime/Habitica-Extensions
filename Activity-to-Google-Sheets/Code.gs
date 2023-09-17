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
/* [Users] Optional customizations to fill in */
/* ========================================== */

/**
 * Maximum rate (in minutes) to allow API requests
 * Probably don't set to less than 2 to avoid API request failures
 * Habitica blocks requests after 30 per minute
 */
const MAX_API_REQUEST_RATE = 5

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

var lastAPIRequestTimestamp

var postDataContents
var apiUserStats

/**
 * [Users] Run this function manually once
 * Creates the webhook only if it doesn't already exist
 */
function doOneTimeSetup() {
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

/**
 * Runs when receiving webhook data
 * @param {string} JSON containing POST data
 * @returns {*} HtmlService.createHtmlOutput() Basic HTML response
 */
function doPost(e) {
  postDataContents = JSON.parse(e.postData.contents)

  if ( lastAPIRequestTimestamp == undefined ) {
    lastAPIRequestTimestamp = 0
  }

  if ( Date.now() - lastAPIRequestTimestamp > MAX_API_REQUEST_RATE * 1000 ) {
    apiUserStats = JSON.parse(api_getAuthenticatedUserProfile("stats"))

    lastAPIRequestTimestamp = Date.now()
  }

  taskActivityToGoogleSheets(postDataContents, apiUserStats)

  return HtmlService.createHtmlOutput()
}

/**
 * Takes scoring data from the webhook and appends it to the end of a Google Sheet
 * @param {object} postDataContents Parsed POST data
 */
function taskActivityToGoogleSheets(postDataContents, apiUserStats) {
  const dateNow = new Date(Date.now())
  dateNow.setTime(dateNow.getTime())

  const customTimestamp = dateNow.getFullYear() + "/" + ( dateNow.getMonth() + 1 ) + "/" + dateNow.getDate() + " " + dateNow.getHours() + ":" + dateNow.getMinutes() + ":" + dateNow.getSeconds()

  if (postDataContents.type == "scored") {
    // Format data for inserting into the spreadsheet
    // TODO - This is a test
    var spreadsheetPayload = [
      [
        customTimestamp,
        apiUserStats.data.flags.cronCount,
        postDataContents.task.text,
        postDataContents.task.notes,
        postDataContents.direction,
        postDataContents.task.type,
        postDataContents.task.id,
        postDataContents.task.tags.toString(),
        postDataContents.delta,
        postDataContents.task.value,
        postDataContents.task.priority
      ]
    ]

    sheetRange = SHEET_NAME + "!A:A"
    // Put data in the spreadsheet
    appendValues(SPREADSHEET_ID, sheetRange, spreadsheetPayload, "RAW")
  }
}

/**
 * Appends values to the specified sheet
 * @param {string} spreadsheetId Spreadsheet's ID
 * @param {string} sheetName Sheet in the spreadsheet
 * @param {list<string>} Values list of rows of values to input
 * @param valueInputOption Determines how the input should be interpreted
 * @see
 * https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
 * @returns {*} spreadsheet Spreadsheet with appended values
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

/**
 * Create a webhook if it doesn't already exist
 * @param {object} payload Object containing webhook create request data
 */
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

/**
 * Get currently registered webhooks
 * Used to detect duplicates when creating the webhook
 * @returns {string} webhooks JSON data listing currently registered webhooks
 */
function api_getWebhooks() {
  const params = {
    "method" : "get",
    "headers" : HEADERS,
    "muteHttpExceptions" : true,
  }
  
  const url = "https://habitica.com/api/v3/user/webhook"
  return UrlFetchApp.fetch(url, params)
}

/**
 * Creates a webhook
 * Called if there the webhook doesn't already exist
 * @param {object} payload Object containing webhook create request data
 * @returns {string} fetchData JSON of web request data
 */
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

/**
 * Gets user profile information
 * Used in this script only to get the current cron count
 * @params {string} userFields Subsection of user data to request. This script only requests "stats"
 * @returns {string} userProfile JSON containing user profile data
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
