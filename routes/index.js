const express = require("express");
const router = express.Router();

const apiRouter = require("./api");
const actionsRouter = require("./actions");

router.use("/api", apiRouter);
router.use("/actions", actionsRouter);

module.exports = router;
