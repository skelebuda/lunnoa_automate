import { createApp } from '@lunnoa-automate/toolkit';

import { agents } from './lib/agents/agents.app';
import { ai } from './lib/ai/ai.app';
//import { airtable } from './lib/airtable/airtable.app';
import { anchorBrowser } from './lib/anchor-browser/anchor-browser.app';
import { anthropic } from './lib/anthropic/anthropic.app';
import { bsiCustomerSuite } from './lib/bsi-customer-suite/bsi-customer-suite.app';
//import { apify } from './lib/apify/apify.app';
//import { braveSearch } from './lib/brave-search/brave-search.app';
import { calendly } from './lib/calendly/calendly.app';
import { codesandbox } from './lib/codesandbox/codesandbox.app';
import { csv } from './lib/csv/csv.app';
import { date } from './lib/date/date.app';
//import { deepseek } from './lib/deepseek/deepseek.app';
import { dropbox } from './lib/dropbox/dropbox.app';
import { finnova } from './lib/finnova/finnova.app';
import { firecrawl } from './lib/firecrawl/firecrawl.app';
import { flowControl } from './lib/flow-control/flow-control.app';
import { gemini } from './lib/gemini/gemini.app';
import { gmail } from './lib/google-gmail/gmail.app';
import { googleCalendar } from './lib/google-calendar/google-calendar.app';
import { googleContacts } from './lib/google-contacts/google-contacts.app';
import { googleDocs } from './lib/google-docs/google-docs.app';
import { googleDrive } from './lib/google-drive/google-drive.app';
import { googleForms } from './lib/google-forms/google-forms.app';
import { googleSheets } from './lib/google-sheets/google-sheets.app';
import { googleSlides } from './lib/google-slides/google-slides.app';
import { hubspot } from './lib/hubspot/hubspot.app';
import { json } from './lib/json/json.app';
import { knowledge } from './lib/knowledge/knowledge.app';
import { linkedin } from './lib/linkedin/linkedin.app';
import { list } from './lib/list/list.app';
import { math } from './lib/math/math.app';
import { microsoftExcel365 } from './lib/microsoft-excel-365/microsoft-excel-365.app';
import { microsoftOutlook } from './lib/microsoft-outlook/microsoft-outlook.app';
import { monday } from './lib/monday/monday.app';
//import { notion } from './lib/notion/notion.app';
import { openai } from './lib/openai/openai.app';
//import { paradigmVendo } from './lib/paradigm-vendo/paradigm-vendo.app';
import { perplexityAi } from './lib/perplexity-ai/perplexity-ai.app';
import { phone } from './lib/phone/phone.app';
import { pinecone } from './lib/pinecone/pinecone.app';
import { postgresqlApp } from './lib/postgresql/postgresql.app';
//import { salesRabbit } from './lib/sales-rabbit/sales-rabbit.app';
import { serper } from './lib/serper/serper.app';
import { slack } from './lib/slack/slack.app';
import { surgemsg } from './lib/surgemsg/surgemsg.app';
import { text } from './lib/text/text.app';
//import { togetherAi } from './lib/together-ai/together-ai.app';
//import { vapi } from './lib/vapi/vapi.app';
import { variables } from './lib/variables/variables.app';
import { web } from './lib/web/web.app';
import { x } from './lib/x/x.app';
//import { xai } from './lib/xai/xai.app';
//import { youtube } from './lib/youtube/youtube.app';
//import { zohoBooks } from './lib/zoho-books/zoho-books.app';
//import { zohoCrm } from './lib/zoho-crm/zoho-crm.app';
import { customApp } from './lib/custom-app/custom-app.app'
import { confluence } from './lib/confluence/confluence.app';


const apps: Record<string, ReturnType<typeof createApp>> = {
  [agents.id]: agents,
  [ai.id]: ai,
  //[airtable.id]: airtable,
  [anchorBrowser.id]: anchorBrowser,
  [anthropic.id]: anthropic,
  //[apify.id]: apify,
 // [braveSearch.id]: braveSearch,
  [calendly.id]: calendly,
  [codesandbox.id]: codesandbox,
  [csv.id]: csv,
  [date.id]: date,
  //[deepseek.id]: deepseek,
  [dropbox.id]: dropbox,
  [firecrawl.id]: firecrawl,
  [flowControl.id]: flowControl,
  [gemini.id]: gemini,
  [gmail.id]: gmail,
  [googleCalendar.id]: googleCalendar,
  [googleContacts.id]: googleContacts,
  [googleDocs.id]: googleDocs,
  [googleDrive.id]: googleDrive,
  [googleForms.id]: googleForms,
  [googleSheets.id]: googleSheets,
  [googleSlides.id]: googleSlides,
  [hubspot.id]: hubspot,
  [json.id]: json,
  [knowledge.id]: knowledge,
  [linkedin.id]: linkedin,
  [list.id]: list,
  [math.id]: math,
  [microsoftExcel365.id]: microsoftExcel365,
  [microsoftOutlook.id]: microsoftOutlook,
  //[notion.id]: notion,
  [openai.id]: openai,
  //[paradigmVendo.id]: paradigmVendo,
  [perplexityAi.id]: perplexityAi,
  [phone.id]: phone,
  [pinecone.id]: pinecone,
  [postgresqlApp.id]: postgresqlApp,
  //[salesRabbit.id]: salesRabbit,
  [serper.id]: serper,
  [slack.id]: slack,
  [surgemsg.id]: surgemsg,
  [text.id]: text,
//[togetherAi.id]: togetherAi,
 // [vapi.id]: vapi,
  [variables.id]: variables,
  [web.id]: web,
  [x.id]: x,
  //[xai.id]: xai,
  //[youtube.id]: youtube,
  //[zohoBooks.id]: zohoBooks,
  //[zohoCrm.id]: zohoCrm,
  [customApp.id]: customApp,
  [confluence.id]: confluence,
  [finnova.id]: finnova,
  [bsiCustomerSuite.id]: bsiCustomerSuite,
  [monday.id]: monday,
};

export default apps;
