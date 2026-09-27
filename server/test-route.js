import express from "express";
import projectsRouter from "./src/routes/projects.js";
import { guestIdentity } from "./src/middleware/guestAuth.js";
console.log("Projects Router layers:");
projectsRouter.stack.forEach(l => console.log(l.route?.methods, l.route?.path, l.name));
