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

    if (item.status !== "list") {
      debug("Item Not Listed");
      return res.status(500).send(i18next.t("errors.internal_error"));
    }

    return res.status(200).json({
      icon: item.image,
      title: item.name,
      description: item.description,
      links: {
        actions: [
          {
            label: "Buy (" + item.price + " SOL)",
            href: "/actions/items/" + item.id + "/buy",
          },
          {
            label: "Make Offer",
            href: "/actions/items/" + item.id + "/offer/{price}",
            parameters: [
              {
                name: "price",
                label: "Enter offer price",
              },
            ],
          },
        ],
      },
    });
  } catch (error) {
    debug(error);
    return res.status(500).send(i18next.t("errors.internal_error"));
  } finally {
    prisma.$disconnect();
  }
});

router.post("/:id/buy", async (req, res) => {
  return res.status(500).send(i18next.t("errors.internal_error"));
});

router.post("/:id/offer/:price", async (req, res) => {
  return res.status(500).send(i18next.t("errors.internal_error"));
});

module.exports = router;
