const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const i18next = require("i18next");
const path = require("path");
const debug = require("debug")("collections");

// helpers
const { isEmpty, responseData, responseError } = require(path.resolve(
  "helpers/utils"
));

// validations
const validateCollection = require(path.resolve("validations/collection"));

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { pageIndex, pageSize, searchValue } = req.query;
    const collections = await prisma.collections.findMany({
      skip: (Number(pageIndex) - 1) * Number(pageSize),
      take: Number(pageSize),
      where: {
        name: {
          contains: searchValue,
        },
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

router.post(
  "/",
  multer({ dest: "uploads/items" }).single("image"),
  async (req, res) => {
    try {
      if (!isEmpty(req.file)) {
        debug(req.file);
        req.body.image = req.file.path;
      }
      const errors = validateCollection(req.body);
      if (errors.length > 0) {
        return responseError(res, errors[0]);
      }

      // get user with wallet address
      let user = await prisma.users.findFirst({
        where: {
          wallet_address: req.body.wallet_address,
        },
      });
      if (!user) {
        user = await prisma.users.create({
          data: {
            wallet_address: req.body.wallet_address,
          },
        });
        debug("New User", user);
      }

      // save item
      await prisma.collections.create({
        data: {
          name: req.body.name,
          image: req.body.image,
          user_id: user.id,
        },
      });
      return responseData(res);
    } catch (error) {
      debug(error);
      return responseError(res, i18next.t("errors.internal_error"));
    } finally {
      await prisma.$disconnect();
    }
  }
);

module.exports = router;
