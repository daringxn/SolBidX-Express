const express = require("express");
const { PrismaClient } = require("@prisma/client");
const i18next = require("i18next");
const path = require("path");
const debug = require("debug")("users");

// helpers
const { responseData, responseError } = require(path.resolve("helpers/utils"));

const router = express.Router();
const prisma = new PrismaClient();

router.get("/:id/collections", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.users.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      debug("Not Found User");
      return responseError(
        res,
        i18next.t("errors.validation.invalid", { name: "User" })
      );
    }
    const collections = await prisma.collections.findMany({
      where: {
        user_id: user.id,
      },
    });
    return responseData(res, collections);
  } catch (error) {
    debug(error);
    return res.status(500).send(i18next.t("errors.internal_error"));
  } finally {
    prisma.$disconnect();
  }
});

module.exports = router;
