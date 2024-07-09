const express = require("express");
const router = express.Router();

const apiRouter = require("./api");
const actionsRouter = require("./actions");
const metadataRouter = require("./actions");

router.use("/api", apiRouter);
router.use("/actions", actionsRouter);
router.use("/actions", metadataRouter);

module.exports = router;
