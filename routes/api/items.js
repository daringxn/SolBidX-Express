const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const i18next = require("i18next");
const path = require("path");
const debug = require("debug")("items");

// helpers
const { isEmpty, responseData, responseError } = require(path.resolve(
  "helpers/utils"
));

//validations
const validateItem = require(path.resolve("validations/item"));

const router = express.Router();
const prisma = new PrismaClient();

router.post(
  "/",
  multer({ dest: "uploads/items" }).single("image"),
  async (req, res) => {
    if (!isEmpty(req.file)) {
      debug(req.file);
      req.body.image = req.file.path;
    }
    const errors = validateItem(req.body);
    if (errors.length > 0) {
      return responseError(res, errors[0]);
    }
    try {
      const newItem = await prisma.item.create({
        data: {
          name: req.body.name,
          description: req.body.description,
          image: req.body.image,
          price: parseFloat(req.body.price),
          properties: req.body.properties,
          size: parseInt(req.body.size),
          blockchain: req.body.blockchain,
          royatity: parseFloat(req.body.royatity),
        },
      });
      return responseData(res, {
        blink_url:
          process.env.BLINK_HOSTNAME +
          "/?action=solana-action:" +
          req.protocol +
          "://" +
          req.hostname +
          "/actions/items/" +
          newItem.id,
      });
    } catch (error) {
      debug(error);
      return responseError(res, i18next.t("errors.internal_error"));
    } finally {
      await prisma.$disconnect();
    }
  }
);

module.exports = router;
