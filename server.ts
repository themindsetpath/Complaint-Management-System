import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { User, Complaint, UserRole, ComplaintStatus } from "./types";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// In-memory store (for demo/session persistence)
// In a real app, this would be a database like MongoDB or PostgreSQL
let users: User[] = [
  {
    id: 'admin-001',
    name: 'System Administrator',
    email: 'admin@pmdc.edu',
    role: UserRole.ADMIN,
    password: 'adminpassword'
  }
];
let complaints: Complaint[] = [];

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

const broadcast = (data: any) => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// API Routes
app.get("/api/users", (req, res) => {
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const newUser = req.body;
  users.push(newUser);
  res.status(201).json(newUser);
});

app.get("/api/complaints", (req, res) => {
  res.json(complaints);
});

app.post("/api/complaints", (req, res) => {
  const newComplaint = req.body;
  complaints.unshift(newComplaint);
  broadcast({ type: "COMPLAINT_CREATED", payload: newComplaint });
  res.status(201).json(newComplaint);
});

app.patch("/api/complaints/:id", (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const index = complaints.findIndex((c) => c.id === id);
  
  if (index !== -1) {
    complaints[index] = {
      ...complaints[index],
      status,
      adminNotes: adminNotes || complaints[index].adminNotes,
      updatedAt: new Date().toISOString(),
    };
    broadcast({ type: "COMPLAINT_UPDATED", payload: complaints[index] });
    res.json(complaints[index]);
  } else {
    res.status(404).json({ error: "Complaint not found" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }
}

setupVite().then(() => {
  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
