# BREW & BEAN — Coffee Shop Management System

## 1. Project Overview

BREW & BEAN is a full-stack Coffee Shop Management System developed as a group assignment for BIWA2110 – Web Application Development.

The system provides an online platform where customers can browse coffee shop products, add items to a shopping cart and place orders. It also provides a secure staff dashboard for managing menu items, monitoring customer orders and updating order statuses.

The application was developed using React, Express.js, the Fetch API and a persistent key-value NoSQL database.

 2. Project Objectives

- Develop a responsive customer-facing coffee shop website.
- Allow customers to browse products and place orders online.
- Provide staff with a dashboard for managing menu items and customer orders.
- Implement REST API communication between the frontend and backend.
- Store menu items and orders in a persistent NoSQL database.
- Deploy the frontend and backend using cloud hosting platforms.
- Use GitHub for source code management and collaboration.

 3. Technologies Used

 Technology  Purpose 

 React        Frontend development 
 JavaScript   Application functionality 
 CSS          Styling and responsive design 
 Express.js   Backend REST API 
 Node.js      Backend runtime 
 Fetch API    Frontend-backend communication 
 UpstashRedis Key-value NoSQL database 
 GitandGitHub Version control and collaboration 
 Vercel       Frontend hosting   
 Render       Backend hosting |

4. System Architecture

The application follows a client-server architecture.

1. Customers and staff interact with the React frontend.
2. The frontend uses the Fetch API to send HTTP requests.
3. Express.js receives and processes API requests.
4. The backend communicates with Upstash Redis to store and retrieve menu items and orders.
5. The backend returns responses to the frontend.

Architecture flow:

React Frontend → Fetch API → Express.js REST API → Upstash Redis

5. Main System Features

 Customer Interface

- Browse available coffee, tea, pastries and other products.
- View product names, descriptions and prices.
- Add products to the shopping cart.
- Increase or decrease item quantities.
- Submit customer details and place orders.
- Receive order confirmation with a unique order number.

 Staff Dashboard

- Secure staff login.
- View customer orders.
- Monitor order totals and daily summaries.
- Update order statuses:
  - Pending
  - Preparing
  - Ready
  - Collected
- Add new menu items.
- Edit product information and prices.
- Update product availability.
- Delete menu items.

6. Database

The application uses Upstash Redis as its key-value NoSQL database.

Redis stores menu items and customer orders using unique identifiers and structured JSON records.

The database is accessed through the Express.js backend. Database credentials are configured through backend environment variables and should never be committed to GitHub.

REST API Endpoints

 Method  Endpoint     Description 

 GET     /api/health      Check backend availability 
 GET     /api/menu        Retrieve all menu items 
 GET    /api/menu/:id      Retrieve a specific menu item 
 POST   /api/menu          Add a menu item 
 PUT    /api/menu/:id      Update a menu item
 DELETE  /api/menu/:id     Delete a menu item 
 GET     /api/orders        Retrieve customer orders 
 GET     /api/orders/:id    Retrieve a specific order 
 POST    /api/orders        Place a customer order 
 PATCH    /api/orders/:id/status  Update an order status 
 POST     /api/staff/login       Authenticate staff 

Staff management endpoints require authentication.

 8. Deployment

The application is deployed using separate cloud hosting services.

Frontend — Vercel

https://brew-and-bean-karabo.vercel.app

Staff Dashboard

https://brew-and-bean-karabo.vercel.app/staff

Backend — Render

https://brew-and-bean-api.onrender.com

Backend Health Endpoint

https://brew-and-bean-api.onrender.com/api/health

GitHub Repository

https://github.com/mangoele/brew-and-bean_karabo

The frontend communicates with the deployed backend through the `VITE_API_URL` environment variable.

 9. Local Installation and Setup

 Prerequisites

- Node.js and npm
- Git
- A GitHub account
- An Upstash Redis database

### Clone the repository

```bash
git clone https://github.com/mangoele/brew-and-bean_karabo.git
cd brew-and-bean_karabo
```

### Set up the backend

```bash
cd backend
npm install
```

Configure the required backend environment variables, including Redis credentials and staff authentication settings.

Start the backend using the development script configured in `package.json`.

### Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Configure the frontend environment variable:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend using the development script configured in `package.json`.

The local application can then be accessed through the Vite development server address.

 10. Security and Validation

- Staff management endpoints are protected by authentication.
- Staff login uses password verification and token-based authentication.
- Backend environment variables are used for sensitive credentials.
- The backend validates incoming requests.
- Appropriate error responses are returned for unsuccessful requests.

11. Group Members and Contributions

The project was developed collaboratively by the following group members:

1. Karabo Thokoa
2. Rets'epile Thamae
3. Kananelo Moshesha
4. Kananelo Ncheke
5. Mofokeng Majara
6. Bahlakoana Leche

All members participated collaboratively in project planning, system design, development discussions, implementation, testing and review.

## 12. Conclusion

The BREW & BEAN Coffee Shop Management System demonstrates the application of full-stack web development technologies in solving a practical business problem.

The project integrates a React frontend, Express.js backend, Fetch API and persistent key-value NoSQL database. It provides customer ordering functionality and staff management features through independently hosted frontend and backend services.

The project demonstrates REST API integration, database interaction, authentication, cloud deployment and collaborative software development.

