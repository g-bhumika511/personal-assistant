# Quiet Desk

Quiet Desk is a calm personal assistant for students. Students get many
events, interviews, deadlines, and announcements buried in email, and need
one calm list of what matters and what to do next.

## Project files

- `README.md` - the project brief, MVP scope, stretch goals, and inbox review.
- `src/App.jsx` - the Today and Plan views, item cards, offline save, and
  calendar download actions.
- `src/App.css` and `src/index.css` - the Quiet Desk visual design and
  responsive layout.
- `src/lib/emailItems.js` - the real inbox source inventory, extracted item
  data, date formatting, and `.ics` generation helpers.
- `index.html` - the Quiet Desk document title.
- `api/extract.js` - a server-side Gemma extraction endpoint for Vercel. The
  production secret is `GEMMA_API_KEY`; it is never bundled into browser code.
- `api/auth/` and `api/gmail/messages.js` - Gmail OAuth and server-side Gmail
  message reading. Google Calendar is intentionally not connected; calendar
  actions download `.ics` files.
- `api/inbox.js` - reads the real local `.eml` files from `inbox/` for the
  local import flow.
- `api/plan.js` - powers the planning chat with Gemma using the current item
  list as grounded context.

## Deploying

Deploy this repository to Vercel with the project root set to
`personal-assistant`. Add `GEMMA_API_KEY`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and a long random
`SESSION_SECRET` as Vercel environment variables. Set the Google OAuth
redirect URI to `https://your-domain.example/api/auth/callback`, then use
the standard build command `npm run build` and output directory `dist`.

The current UI ships with the reviewed inbox extraction so it is immediately
usable after deployment. Click **Connect Gmail**, approve read-only Gmail
access, then click **Refresh Gmail**. The server fetches recent messages and
extracts items through Gemma. No Gmail password is stored. Do not put secrets
in a `VITE_` variable, because Vite exposes `VITE_` variables to the browser
bundle.

The Today view also includes a **Quiet Desk planner**. Ask it what to do first,
which deadlines matter, or how to resolve a schedule conflict. It uses only
the items currently shown in the app, and displays the server error if Gemma
is unavailable. Items include priority, an urgency explanation, and source
evidence. The weekly ezine contributes its fee deadline, Black History Month
event, and Halloween event; the jobs alert contributes a career opportunities
item.

## Run locally

Install Node.js 20 or newer, then from `personal-assistant/` run:

```bash
npm install
npx vercel dev
```

Open the local URL shown by Vercel (normally `http://localhost:3000`).
Copy `.env.example` to `.env.local`, fill in the values, and restart the
server. In Google Cloud Console, create a Web application OAuth client,
enable the Gmail API, add `http://localhost:3000/api/auth/callback` as an
authorised redirect URI, and add your account as a test user. The app asks
only for read-only Gmail access. Without OAuth variables, the local reviewed inbox items and offline `.ics`
downloads still work. With `GEMMA_API_KEY` configured, **Read local inbox**
reads the actual `.eml` files and extracts their items dynamically.

## MVP features

1. **Email to items** - Read `.eml` files from `inbox/` and, later, emails
   fetched automatically from Gmail over IMAP. Use the Gemma model via Google
   AI Studio, with the key read server-side from `   GEMMA_API_KEY`, using the configured Gemma model (`GEMMA_MODEL`), to extract events,
   interviews, deadlines, and announcements. Each item should include a title,
   date, time, location, and whether it is free or paid.
2. **Today and Plan views** - Today shows today's items. Plan shows the next
   seven days grouped by day. Both views are saved in `localStorage` so they
   work offline after loading.
3. **Add to calendar** - Each item has a button that downloads an `.ics` file.

## Stretch goals

These are **not part of the MVP**:

- Google Calendar sync
- Sign-in
- Direct Gmail OAuth

## Inbox review

The project currently contains six `.eml` files in `inbox/`, although the
requested brief refers to five. All six are real emails and were reviewed;
no sample emails were created.

- `Outstanding items to be completed asap.eml` - a society administration
  announcement and deadline to complete outstanding questions or training by
  October 31.
- `Re_ Volunteering opportunity - Black History Month event with EDI.eml` - a
  volunteering event opportunity for Black History Month, with setup and
  redirection duties on October 29 from 11am to 2pm.
- `Reminder_ School of CS Research Seminar Series - today, Thursday 29th October - 2pm.eml`
  - a research seminar event on October 29 at 2pm in CSB-1005.
- `Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml` - a weekly student
  newsletter containing several campus and community events, including a
  Black History Month event, plus a semester-fee payment deadline and other
  announcements and opportunities.
- `Weekly Jobs & Opportunities Alert from the Career Development Centre.eml`
  - a jobs and opportunities announcement containing roles, internships, and
  training opportunities.
- `lab delay today_ 2627-CT5141 Optimisation.eml` - a course announcement
  saying the 10am lab is delayed because the teaching assistant is
  unavailable.
