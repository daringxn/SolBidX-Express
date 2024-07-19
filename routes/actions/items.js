const express = require("express");
const { PrismaClient } = require("@prisma/client");
const debug = require("debug")("actions");
const i18next = require("i18next");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.items.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!item) {
      debug("Not Found Item");
      return res.status(500).send(i18next.t("errors.internal_error"));
    }
    return res.status(200).json({
      icon: process.env.APP_HOST + "/" + item.image,
      title: item.name,
      description: item.description,
      label: "Buy(" + item.price + " SOL)",
    });
  } catch (error) {
    debug(error);
    return res.status(500).send(i18next.t("errors.internal_error"));
  } finally {
    prisma.$disconnect();
  }
});

router.post("/items/{id}", async (req, res) => {
  return res.status(500).send(i18next.t("errors.internal_error"));
});

module.exports = router;
