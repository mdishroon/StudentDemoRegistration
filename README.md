# Student Registration Demo
This project is a web-based registration system for student project demonstrations. It allows students to register for available time slots to present their projects.
# Features

- Student registration form with validation
- Dynamic display of available time slots
- Database storage of registration data
- View of all registered students

# Technology Stack (In-Depth Explanation Below)

Frontend: HTML, CSS, JavaScript
Backend: PHP
Database: PostgreSQL (Neon)
Hosting: Vercel

## Running

1. Clone the repository.
2. Ensure you have [Node.js](https://nodejs.org/en/download) downloaded. Installing Node will also install `npm`, the default package manager for Node. You can verify their installations by running the following commands:

    ```sh
    node --version
    npm --version
    ```

3. Next, `cd` into the directory and run `npm install`.
4. Rename `.env.example` to `.env` and replace with the values provided by Vercel.
5. Finally, run `npm run dev`.

### Adding new pages

To add a new page:

1. Create a new `.html` file at the root (or a subdirectory for nested paths) e.g. `about.html` or `/nested/page.html`.
2. Open [`vite.config.js`](/vite.config.js) and add a new entry under `rollupOptions.input`. The key name doesn't matter, but the value should be similar to the existing entries; pass a relative path as the second argument to `path.resolve`.

    For example, to add a new page called `previousSemesterProjects.html`:

    ```js
    // vite.config.js
    export default defineConfig({
      // ... other options
      rollupOptions: {
        input: {
          // ... other entry points
          menu: path.resolve(dirname, "previousSemesterProjects.html"),
        }
      }
    })
    ```

## Stack

> [!IMPORTANT]
> These are not comprehensive definitions/summaries of each technology, they're purposely barebones to give a general idea of what each of them do.

- [Node.js](https://nodejs.org/en) for the runtime
  - Normally, back in the good ol' days, JavaScript was only able to be ran in the browser, but now we have various runtimes (platform-agnostic environments that can execute code) that can run JS virtually anywhere.
- [Vercel](https://vercel.com/) for hosting (and providing the database and blob storage)
  - Vercel handles website hosting, along with a bunch of other stuff that you can integrate, such as providing a database and storage like this demo uses.
- [Neon](https://neon.tech/) for the database
  - Neon is a newer platform that hosts serverless databases using [PostgreSQL](https://www.postgresql.org/).
  - Serverless databases handle a lot of the database management for you:
    - Only runs when queried
    - Automatically scales based on how much data is needed
  - As opposed to traditional databases:
    - Requires a server that's always running
    - You manage and scale it yourself
- [Vite](http://vitejs.dev/) for building the frontend and integrating with Express
  - Bundlers take all of your projects files and converts them into optimized files that the browser can load efficiently. They remove unused code, minimize source code, breaks code into smaller chunks to only load what's needed, and converts modern syntax to older, equivalent versions for backwards compatibility.
  - Vite also updates the browser instantly whenever you make a change amongst many other features that make the local development experience much easier.
- [Express](https://expressjs.com/) for handling backend server requests
  - A minimal web framework that helps build web servers and APIs.
  - It handles HTTP requests, routing, and middleware, forms submissions, etc.
