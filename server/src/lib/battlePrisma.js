// Battle-specific Prisma client — connects to dsa_battle database
import { PrismaClient } from "../generated/battle-client/index.js";

const battlePrisma = new PrismaClient();

export default battlePrisma;
