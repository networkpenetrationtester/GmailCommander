If you actually care, download the modules required by modules.js, (sorry, its a lot of shit by google)
This app requires you to follow the instructions for the GMAIL API as defined by google;
creating an API key/application to access GMAIL via google console & authorizing your
person email account to use your api. save the credentials in the root directory as
'oauth2.keys.json'. Run the program a first time, follow the login process, restart the application,
and now you should be able to traverse the TUI.

The current process to fetch emails goes as follows:

LABEL - select LABEL menu.

LBLIST - list LABELs in your inbox.

SEARCHMSG,5,10 - search for the most recent 10 messages under LABEL id 5.

SHOWMSG,\<id> - display a snippet of the email content as JSON, (future implementation will let you read the entire email)

and if you wish, SAVEMSG,\<id>, which will save it in .eml format to /messages.

**idrk why there's two files for auth, I may merge them in future updates (if there are any smh)**

**THE VISION: a powerful tool for performing operations in gmail.**

**e.g.: Traverse the entire SPAM label contents automatically, rip sender IP values from metadata,**
**save all SPAM emails as text attachments, create a db linking all attachment names to sender IP as array,**
**perform bulk WHOIS/NSLOOKUP, etc. to find abuse registrars, save those to db as well** 
**self-bot sending emails to abuse registrars corresponding to abusive IP address, attaching spam email as evidence.**

**THE PURPOSE: I'm fucking sick and tired of spam bombs.**