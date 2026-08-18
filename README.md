# Hoopla Hub

Build a production-ready web app, Ecluid Basketball, for basketball tournament management SaaS similar to Score7.io.

- Responsive mobile-first layout

-Tournament Formats

League Cum-Knockout (refer to the uploaded reference Word document)

Round Robin with the option to select single/double and so on, according to the requirement.

Also, an option to upload and auto-detect match format and bracket schedule from PDF or xml files.

Create a polished SaaS interface with minimal morden animated sports vibe ui/ux.

Core app requirements:

Tournament Management

Create pages to:

- Create a tournament

- View all tournaments

- View tournament details

- Edit tournament

- Delete/archive tournament

Tournament fields:

- Name

- Format

-Number of Teams

- Start date

- End date

- Venue with Google map input

- Status

- Logo

- Description

-Tournament Banner

Supported formats:

- Single elimination

- Double elimination

- Round robin with single, double, and more legs to support, with the option to build a custom playoff 

- League

- Group stage + knockout

5. Team Management

Create team CRUD inside each tournament:

- Team name

- Logo

- Coach name

- Manager name

- Contact

- Jersey color

- Roster list

- social media handles

6. Player Management

Create player CRUD:

- Name

- Photo

- Jersey number

- Position

- Age

- Height

- Team

- Statistics

Match Scheduling

Create a match schedule page with:

- Calendar/list view

- Match date and time

- Venue/court

- Team A with logo

- Team B with logo

- Match status

- Referee

- Score input

- option to switch between home and away team.

 Standings

Create an automatic standings table:

- Played

- Wins

- Losses

- Points for

- Points against

- Point difference

- Ranking

Public Tournament Page

Create public shareable tournament pages:

- Fixtures

- Results

- Standings

- Brackets

- Teams

- Sponsors

- QR code placeholder

- Public URL structure: /public/tournament/[slug]

 Sponsor Module

Create sponsor management:

- Sponsor name

- Logo

- Tier

- Contact person

- Amount

- Placement area

- Notes

Show sponsors on public tournament pages.

Settings

Create organization settings:

- Organization name

- Logo

- Brand colors

- Contact info

- Social links

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swift-bracket-system.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/36ba4f35-114e-4f9c-9c30-d3c89ac28b4d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
