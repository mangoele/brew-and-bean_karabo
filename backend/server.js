
const express = require("express");
const cors = require("cors");
const { Redis } = require("@upstash/redis");
const { randomUUID } = require("crypto");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// Redis connection
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// Middleware
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}));

// Parse incoming JSON and URL-encoded request bodies.
// These must be registered before API routes that read req.body.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// STAFF LOGIN
app.post("/api/staff/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        if (
            !process.env.STAFF_USERNAME ||
            !process.env.STAFF_PASSWORD_HASH ||
            !process.env.JWT_SECRET
        ) {
            return res.status(500).json({
                success: false,
                message: "Staff authentication is not configured."
            });
        }

        const validUsername =
            username === process.env.STAFF_USERNAME;

        const validPassword = await bcrypt.compare(
            password,
            process.env.STAFF_PASSWORD_HASH
        );

        if (!validUsername || !validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const token = jwt.sign(
            {
                username: process.env.STAFF_USERNAME,
                role: "staff"
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.status(200).json({
            success: true,
            message: "Staff login successful.",
            token,
            user: {
                username: process.env.STAFF_USERNAME,
                role: "staff"
            }
        });

    } catch (error) {
        console.error("Staff login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to process staff login."
        });
    }
});

// STAFF AUTHENTICATION MIDDLEWARE
function authenticateStaff(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Staff authentication required."
        });
    }

    const token = authorization.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "staff") {
            return res.status(403).json({
                success: false,
                message: "Staff access only."
            });
        }

        req.staff = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }
}

// Database status
let redisStatus = "Checking";

// Initial BREW & BEAN menu
const defaultMenu = [
    {
        id: "1",
        name: "Signature Cappuccino",
        category: "Coffee",
        price: 45,
        description: "Rich espresso topped with creamy steamed milk.",
        available: true
    },
    {
        id: "2",
        name: "Classic Espresso",
        category: "Coffee",
        price: 30,
        description: "Strong and smooth traditional espresso.",
        available: true
    },
    {
        id: "3",
        name: "Caramel Latte",
        category: "Coffee",
        price: 50,
        description: "Smooth espresso blended with caramel and milk.",
        available: true
    },
    {
        id: "4",
        name: "Mocha Delight",
        category: "Coffee",
        price: 55,
        description: "A delicious combination of coffee and chocolate.",
        available: true
    },
    {
        id: "5",
        name: "Classic English Tea",
        category: "Tea",
        price: 25,
        description: "Traditional English tea served fresh.",
        available: true
    },
    {
        id: "6",
        name: "Green Tea",
        category: "Tea",
        price: 28,
        description: "Refreshing green tea with a delicate flavour.",
        available: true
    },
    {
        id: "7",
        name: "Chocolate Croissant",
        category: "Pastries",
        price: 35,
        description: "Flaky pastry filled with rich chocolate.",
        available: true
    },
    {
        id: "8",
        name: "Blueberry Muffin",
        category: "Pastries",
        price: 30,
        description: "Freshly baked muffin with blueberries.",
        available: true
    },
    {
        id: "9",
        name: "Iced Caramel Coffee",
        category: "Cold Beverages",
        price: 55,
        description: "Chilled coffee with milk and smooth caramel.",
        available: true
    },
    {
        id: "10",
        name: "Fresh Lemonade",
        category: "Cold Beverages",
        price: 30,
        description: "Refreshing citrus lemonade served chilled.",
        available: true
    }
];

// Welcome route
app.get("/", (req, res) => {
    res.send("Welcome to the BREW & BEAN Coffee Shop API!");
});

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "BREW & BEAN API is running!",
        server: "Healthy",
        database: redisStatus
    });
});

// GET all menu items
app.get("/api/menu", async (req, res) => {
    try {
        const storedMenu = await redis.get("menu:items");

        const menu = typeof storedMenu === "string"
            ? JSON.parse(storedMenu)
            : storedMenu || [];

        res.status(200).json({
            success: true,
            count: menu.length,
            data: menu
        });

    } catch (error) {
        console.error("Error retrieving menu:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve menu items."
        });
    }
});

// GET a single menu item by ID
app.get("/api/menu/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const storedMenu = await redis.get("menu:items");

        const menu = typeof storedMenu === "string"
            ? JSON.parse(storedMenu)
            : storedMenu || [];

        const item = menu.find(product => product.id === id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });

    } catch (error) {
        console.error("Error retrieving menu item:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve menu item."
        });
    }
});



// POST a new menu item
app.post("/api/menu", authenticateStaff, async (req, res) => {
    try {
        const { name, category, price, description, available } = req.body;

        // Validate required fields
        if (
            !name ||
            !category ||
            price === undefined ||
            !description ||
            typeof available !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required menu item fields."
            });
        }

        // Validate price
        if (typeof price !== "number" || price <= 0 || !Number.isFinite(price)) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid positive number."
            });
        }

        // Retrieve existing menu
        const storedMenu = await redis.get("menu:items");

        const menu = typeof storedMenu === "string"
            ? JSON.parse(storedMenu)
            : storedMenu || [];

        // Create new menu item
        const newItem = {
            id: randomUUID(),
            name: name.trim(),
            category: category.trim(),
            price,
            description: description.trim(),
            available
        };

        // Save updated menu
        menu.push(newItem);

        await redis.set("menu:items", JSON.stringify(menu));

        res.status(201).json({
            success: true,
            message: "Menu item added successfully.",
            data: newItem
        });

    } catch (error) {
        console.error("Error adding menu item:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to add menu item."
        });
    }
});

// PUT - Update an existing menu item
app.put("/api/menu/:id", authenticateStaff, async (req, res) => {
    try {
        const { id } = req.params;

        const { name, category, price, description, available } = req.body;

        // Validate required fields
        if (
            typeof name !== "string" || !name.trim() ||
            typeof category !== "string" || !category.trim() ||
            typeof description !== "string" || !description.trim() ||
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price <= 0 ||
            typeof available !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid values for all menu item fields."
            });
        }

        // Retrieve existing menu
        const storedMenu = await redis.get("menu:items");

        const menu = typeof storedMenu === "string"
            ? JSON.parse(storedMenu)
            : storedMenu || [];

        // Find the product
        const itemIndex = menu.findIndex(product => product.id === id);

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        // Update product details
        menu[itemIndex] = {
            id,
            name: name.trim(),
            category: category.trim(),
            price,
            description: description.trim(),
            available
        };

        // Save updated menu to Redis
        await redis.set("menu:items", JSON.stringify(menu));

        res.status(200).json({
            success: true,
            message: "Menu item updated successfully.",
            data: menu[itemIndex]
        });

    } catch (error) {
        console.error("Error updating menu item:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to update menu item."
        });
    }
});

// DELETE a menu item
app.delete("/api/menu/:id", authenticateStaff, async (req, res) => {
    try {
        const { id } = req.params;

        // Retrieve existing menu
        const storedMenu = await redis.get("menu:items");

        const menu = typeof storedMenu === "string"
            ? JSON.parse(storedMenu)
            : storedMenu || [];

        // Find the product
        const itemIndex = menu.findIndex(
            product => product.id === id
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        // Remove the product
        const deletedItem = menu.splice(itemIndex, 1)[0];

        // Save the updated menu
        await redis.set("menu:items", JSON.stringify(menu));

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully.",
            data: deletedItem
        });

    } catch (error) {
        console.error("Error deleting menu item:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to delete menu item."
        });
    }
});

// POST - Place a customer order
app.post("/api/orders", async (req, res) => {
    try {
        const { customerName, customerPhone, items } = req.body;

        // Validate customer details
        if (
            typeof customerName !== "string" ||
            !customerName.trim() ||
            typeof customerPhone !== "string" ||
            !customerPhone.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Customer name and phone number are required."
            });
        }

        // Validate order items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "An order must contain at least one item."
            });
        }

        // Retrieve menu from Redis
        const storedMenu = await redis.get("menu:items");

        const menu = typeof storedMenu === "string"
            ? JSON.parse(storedMenu)
            : storedMenu || [];

        // Build order items and calculate total on the server
        const orderItems = [];

        for (const requestedItem of items) {
            const { menuItemId, quantity } = requestedItem;

            if (
                typeof menuItemId !== "string" ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Each item must have a valid product ID and positive quantity."
                });
            }

            const product = menu.find(
                item => item.id === menuItemId
            );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${menuItemId} was not found.`
                });
            }

            if (!product.available) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} is currently unavailable.`
                });
            }

            orderItems.push({
                menuItemId: product.id,
                name: product.name,
                price: product.price,
                quantity,
                subtotal: product.price * quantity
            });
        }

        // Calculate total
        const total = orderItems.reduce(
            (sum, item) => sum + item.subtotal,
            0
        );

        // Generate unique order details
        const orderId = randomUUID();

        const orderNumber =
            "BB-" + Date.now() + "-" +
            Math.floor(Math.random() * 1000);

        const newOrder = {
            id: orderId,
            orderNumber,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            items: orderItems,
            total,
            status: "Pending",
            createdAt: new Date().toISOString()
        };

        // Retrieve existing orders
        const storedOrders = await redis.get("orders:items");

        const orders = typeof storedOrders === "string"
            ? JSON.parse(storedOrders)
            : storedOrders || [];

        // Save new order
        orders.push(newOrder);

        await redis.set("orders:items", JSON.stringify(orders));

        res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            data: newOrder
        });

    } catch (error) {
        console.error("Error placing order:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to place order."
        });
    }
});

// GET all customer orders
app.get("/api/orders", authenticateStaff, async (req, res) => {
    try {
        // Retrieve orders from Redis
        const storedOrders = await redis.get("orders:items");

        const orders = typeof storedOrders === "string"
            ? JSON.parse(storedOrders)
            : storedOrders || [];

        // Return all orders
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Error retrieving orders:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve customer orders."
        });
    }
});

// GET one customer order by ID
app.get("/api/orders/:id", authenticateStaff, async (req, res) => {
    try {
        const { id } = req.params;

        // Retrieve orders from Redis
        const storedOrders = await redis.get("orders:items");

        const orders = typeof storedOrders === "string"
            ? JSON.parse(storedOrders)
            : storedOrders || [];

        // Find requested order
        const order = orders.find(item => item.id === id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error("Error retrieving order:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve order."
        });
    }
});




// PATCH - Update customer order status
app.patch("/api/orders/:id/status", authenticateStaff, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Allowed order statuses
        const allowedStatuses = [
            "Pending",
            "Preparing",
            "Ready",
            "Collected"
        ];

        // Validate status
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status.",
                allowedStatuses
            });
        }

        // Retrieve orders from Redis
        const storedOrders = await redis.get("orders:items");

        const orders = typeof storedOrders === "string"
            ? JSON.parse(storedOrders)
            : storedOrders || [];

        // Find the order
        const orderIndex = orders.findIndex(
            order => order.id === id
        );

        if (orderIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        // Update order status
        orders[orderIndex].status = status;

        // Save updated orders to Redis
        await redis.set("orders:items", JSON.stringify(orders));

        res.status(200).json({
            success: true,
            message: "Order status updated successfully.",
            data: orders[orderIndex]
        });

    } catch (error) {
        console.error("Error updating order status:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to update order status."
        });
    }
});

// GET daily order summary
app.get("/api/orders/summary/daily", authenticateStaff, async (req, res) => {
    try {
        // Use the requested date or today's date in Lesotho
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Africa/Maseru",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        const date = req.query.date || today;

        // Validate date format
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            new Date(`${date}T00:00:00.000Z`)
                .toISOString().slice(0, 10) !== date
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid date in YYYY-MM-DD format."
            });
        }

        // Retrieve orders from Redis
        const storedOrders = await redis.get("orders:items");

        const orders = typeof storedOrders === "string"
            ? JSON.parse(storedOrders)
            : storedOrders || [];

        // Select orders placed on the requested Lesotho date
        const dailyOrders = orders.filter(order => {
            const orderDate = new Intl.DateTimeFormat("en-CA", {
                timeZone: "Africa/Maseru",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }).format(new Date(order.createdAt));

            return orderDate === date;
        });

        // Calculate daily figures
        const totalOrders = dailyOrders.length;

        const totalOrderValue = dailyOrders.reduce(
            (sum, order) => sum + order.total,
            0
        );

        const collectedRevenue = dailyOrders
            .filter(order => order.status === "Collected")
            .reduce((sum, order) => sum + order.total, 0);

        const averageOrderValue = totalOrders > 0
            ? Number((totalOrderValue / totalOrders).toFixed(2))
            : 0;

        // Count orders by status
        const statusBreakdown = {
            Pending: 0,
            Preparing: 0,
            Ready: 0,
            Collected: 0
        };

        dailyOrders.forEach(order => {
            if (Object.prototype.hasOwnProperty.call(
                statusBreakdown,
                order.status
            )) {
                statusBreakdown[order.status]++;
            }
        });

        res.status(200).json({
            success: true,
            date,
            summary: {
                totalOrders,
                totalOrderValue,
                collectedRevenue,
                averageOrderValue,
                statusBreakdown
            }
        });

    } catch (error) {
        console.error("Error generating daily summary:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to generate daily order summary."
        });
    }
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await redis.set("brew-bean:connection-test", "Connected");

        const result = await redis.get("brew-bean:connection-test");

        if (result !== "Connected") {
            throw new Error("Redis connection test failed.");
        }

        redisStatus = "Connected";
        console.log("Redis database connected successfully!");

        // Only add default menu if no menu exists
        const existingMenu = await redis.get("menu:items");

        if (existingMenu === null) {
            await redis.set("menu:items", JSON.stringify(defaultMenu));
            console.log("Initial menu saved to Redis!");
        } else {
            console.log("Existing menu records found in Redis.");
        }

    } catch (error) {
        redisStatus = "Disconnected";
        console.error("Redis connection error:", error.message);
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`BREW & BEAN server running on port ${PORT}`);
    });
}

startServer();
