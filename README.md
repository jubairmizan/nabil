# Nabil Restaurant Management System - Frontend

This is the frontend for the Nabil Restaurant Management System built with Next.js.

## Setup for Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

There are several ways to deploy this application to production:

### Method 1: Using the built-in Next.js server

```bash
# Build the application
npm run build

# Start the Next.js server
npm start
```

### Method 2: Using the custom server

```bash
# Build the application
npm run build

# Start using custom server.js
npm run start-custom
```

### Method 3: Using PM2 (recommended for production)

[PM2](https://pm2.keymetrics.io/) is a production process manager for Node.js applications.

1. Install PM2 globally (if not already installed):

   ```bash
   npm install -g pm2
   ```

2. Build and start the server:

   ```bash
   npm run build
   npm run start-server
   ```

3. Other PM2 commands:

   ```bash
   # Stop the server
   npm run stop-server

   # Restart the server
   npm run restart-server

   # Check logs
   pm2 logs nabil-restaurant-frontend
   ```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://your-backend-api-url.com
```

For production deployment, you can set this environment variable in your hosting environment.

## Configuring API Endpoints

The API endpoints are configured in `src/lib/api-config.js`. By default:

- In development: It connects to `http://localhost:8000`
- In production: It connects to `http://nabil-backend.projectsample.info`

You can override these by setting the `NEXT_PUBLIC_API_URL` environment variable.

## Features

- **User Authentication**: Login system for staff members
- **Dashboard**: Overview of sales, orders, and restaurant status
- **POS System**: Fast order entry with keyboard shortcuts
  - `Ctrl` key to switch to quantity field
  - `Shift` key to add a new line item
- **Product Management**: View and select products from categories
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- Next.js 14
- React Hooks
- CSS Modules
- JavaScript (JSX)

## Getting Started

### Prerequisites

- Node.js 18.17 or higher
- npm or yarn

### Installation

1. Clone the repository:

```
git clone <repository-url>
```

2. Navigate to the project directory:

```
cd restaurant-pos
```

3. Install dependencies:

```
npm install
```

4. Run the development server:

```
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### Login

- Use the following credentials for demo purposes:
  - Username: `admin`
  - Password: `password`

### POS Page

1. The focus starts in the item code field
2. Enter a product code or select a product from the right panel
3. Press `Ctrl` to move to the quantity field
4. Press `Shift` to add a new row and move focus to the new item code field
5. Continue this process to add multiple items

## Project Structure

- `/src` - Source code
  - `/app` - Next.js app router pages
    - `/login` - Authentication page
    - `/dashboard` - Main dashboard layout and page
    - `/dashboard/pos` - POS system page
  - `/components` - Reusable UI components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
